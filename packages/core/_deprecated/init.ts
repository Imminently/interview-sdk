import axios, {
	type AxiosInstance,
	type AxiosRequestConfig,
	type AxiosRequestTransformer,
} from "axios";
import { debounce, get, isEmpty, isEqual } from "lodash-es";
import { v4 as uuid } from "uuid";
import {
	back,
	chat,
	create,
	exportTimeline,
	load,
	navigate,
	postSimulate,
	submit,
} from "./api";
import {
	buildDynamicReplacementQueries,
	type SidebarSimulate,
	simulate,
	type UnknownValues,
} from "./dynamic";
import { replaceTemplatedText } from "./helpers";
import { SIDEBAR_DYNAMIC_DATA_INFO } from "./sidebars/sidebar";
import {
	type AttributeValues,
	type ChatResponse,
	type FileCtrlTypesNS,
	getIdFromFileAttributeRef,
	type Overrides,
	type RenderableEntityControl,
	type ResponseData,
	type Screen,
	type Session,
	type SessionConfig,
	type State,
	type StepId,
} from "./types";
import {
	applyInstancesToEntityControl,
	buildUrl,
	createEntityPathedData,
	iterateControls,
	range,
} from "./util";

export const createApiInstance = (
	baseURL: string,
	overrides: AxiosRequestConfig = {},
) => {
	const { transformRequest = [] } = overrides;
	return axios.create({
		baseURL,
		timeout: 30000,
		headers: { "Content-Type": "application/json" },
		transformRequest: [
			...(transformRequest as AxiosRequestTransformer[]),
			...(axios.defaults.transformRequest as AxiosRequestTransformer[]),
		],
		...overrides,
	});
};

const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

export const transformResponse = (
	session: Session,
	data: ResponseData,
): ResponseData => {
	const newData = deepClone(data);
	if (session.data["@parent"]) {
		newData["@parent"] = session.data["@parent"];
	}

	for (const control of session.screen.controls) {
		if (control.type === "number_of_instances") {
			const value = newData[control.entity];
			newData[control.entity] = range(Number(value)).map((i) => ({
				"@id": uuid(),
			}));
		}
	}
	return newData;
};

export const defaultPath = ["decisionapi", "session"];
export const defaultFilePath = ["decisionapi", "file"];

type NewDataCallback = ((data: any) => void) | undefined;

export interface InterviewProvider {
	// create a SessionInstance to work with by calling on the decisively service
	create: (
		project: string,
		config: SessionConfig,
		newDataCallback?: NewDataCallback,
	) => Promise<SessionInstance>;
	load: (
		project: string,
		sessionId: string,
		interactionId?: string,
	) => Promise<SessionInstance>;
	finish: () => void;
}

interface SessionInstanceOptions {
	provider: InterviewProvider;
	session: Session;
	api: AxiosInstance;
	fileApi: AxiosInstance;
	project: string;
	release?: string;
	newDataCallback?: (session: SessionObservable) => void;
	responseElements?: any[];
	debug?: boolean;
	uploadFile?: FileCtrlTypesNS.UploadFile;
	downloadFile?: any;
	removeFile?: FileCtrlTypesNS.RemoveFile;
	onFileTooBig?: FileCtrlTypesNS.OnFileTooBig;
	index?: string[];
}

interface SessionInternal {
	userValues: AttributeValues;
	prevUserValues: AttributeValues;

	replacements: AttributeValues;
	unknownsRequiringSimulate: UnknownValues;
	unknownsAlreadySimulated: UnknownValues;
	sidebarSimulate: SidebarSimulate | undefined;

	// we only care about the latest request
	latestRequest: number | undefined;

	// progress tracking
	canProgress: boolean;
}

const postProcessControl = (
	control: any,
	replacements: any,
	data: Session["data"],
	state: State[] | undefined,
	locale: Session["locale"],
) => {
	if (control.templateText) {
		control.text = replaceTemplatedText(
			control.templateText,
			replacements,
			data,
			state,
			locale,
		);
	}
	if (control.templateLabel) {
		control.label = replaceTemplatedText(
			control.templateLabel,
			replacements,
			data,
			state,
			locale,
		);
	}
	if (
		control.type === "switch_container" &&
		control.kind === "dynamic" &&
		control.attribute
	) {
		const update = replacements[control.attribute];
		if (update !== undefined) {
			control.branch = update ? "true" : "false";
		}
	}
	if (control.type === "certainty_container") {
		const update = replacements[control.attribute];
		if (update !== undefined) {
			control.branch =
				replacements[control.attribute] === null ? "uncertain" : "certain";
		}
	}
};

export class SessionInstance implements Session {
	renderAt: number = Date.now();
	externalLoading = false;

	private session!: Session;
	private options: Omit<SessionInstanceOptions, "session">;
	private processedScreen: Screen | undefined;
	private internals: SessionInternal = {
		userValues: {},
		prevUserValues: {},
		replacements: {},
		unknownsRequiringSimulate: {},
		unknownsAlreadySimulated: {},
		latestRequest: undefined,
		sidebarSimulate: undefined,
		canProgress: false,
	};
	private debug: boolean;

	public index: string[] | undefined;

	constructor(options: SessionInstanceOptions) {
		const { session, debug, index, ...otherOptions } = options;
		// @ts-ignore
		this.updateDynamicValues = debounce(
			this.updateDynamicValues.bind(this),
			1000,
		);
		this.options = otherOptions;
		this.updateSession(session);
		this.debug = Boolean(debug);

		this.onScreenDataChange = this.onScreenDataChange.bind(this);

		this.uploadFile = options.uploadFile || this.uploadFile;
		this.removeFile = options.removeFile || this.removeFile;
		this.onFileTooBig = options.onFileTooBig || this.onFileTooBig;
		this.index = index;
	}

	private get api() {
		return this.options.api;
	}

	get provider() {
		return this.options.provider;
	}

	get release() {
		return this.options.release;
	}

	get project() {
		return this.options.project;
	}

	get interactionId() {
		return this.session.interactionId;
	}

	get validations() {
		return this.session.validations;
	}

	private triggerUpdate(
		update: Partial<{ externalLoading: boolean; screen: Screen }>,
	) {
		const { externalLoading, screen } = update;

		if (typeof externalLoading === "boolean") {
			this.externalLoading = externalLoading;
		}
		this.processedScreen = screen ?? this.processedScreen;
		this.renderAt = Date.now();

		if (this.debug) {
			console.log(
				"[@decisively-io/interview-sdk] DEBUG: Triggering update",
				update,
			);
		}

		this.options.newDataCallback?.(update);
	}

	onScreenDataChange(data: AttributeValues) {
		if (this.debug) {
			console.log("[@decisively-io/interview-sdk] DEBUG: Value changed:", data);
		}
		Object.assign(this.internals.userValues, data);
		// call this first so the debounce doesn't fire during unknown calculation
		this.updateDynamicValues();
		this.calculateUnknowns();
	}

	private calculateUnknowns() {
		const { state } = this.session;

		if (state && this.screen) {
			if (this.debug) {
				console.log(
					"[@decisively-io/interview-sdk] DEBUG: Checking for changes:",
					this.internals.prevUserValues,
					this.internals.userValues,
				);
			}
			if (
				!isEqual(this.internals.prevUserValues, this.internals.userValues) &&
				Object.keys(this.internals.userValues).length > 0
			) {
				const replacementQueries = buildDynamicReplacementQueries(
					this,
					this.internals.userValues,
				);

				if (
					replacementQueries.unknownValues.length ||
					Object.keys(replacementQueries.knownValues).length > 0
				) {
					Object.assign(
						this.internals.replacements,
						replacementQueries?.knownValues,
					);

					for (const [key, value] of Object.entries(
						replacementQueries.unknownValues,
					)) {
						if (value) {
							const alreadySimulated =
								this.internals.unknownsAlreadySimulated[key];
							if (alreadySimulated) {
								if (isEqual(alreadySimulated.data, value.data)) {
									continue;
								}
							}
						}
						this.internals.unknownsRequiringSimulate[key] = value;
					}

					if (this.debug) {
						console.log(
							"[@decisively-io/interview-sdk] DEBUG: Calculated knowns:",
							replacementQueries?.knownValues,
						);
						console.log(
							"[@decisively-io/interview-sdk] DEBUG: Calculated unknowns:",
							this.internals.unknownsRequiringSimulate,
						);
					}

					const loading =
						Object.keys(this.internals.unknownsRequiringSimulate).length > 0;

					const newScreen = this.makeScreenCopy();

					this.internals.sidebarSimulate = replacementQueries.sidebarSimulate;
					if (newScreen.sidebars) {
						for (const sidebar of newScreen.sidebars) {
							if (sidebar.id) {
								sidebar.loading = this.internals.sidebarSimulate?.ids.includes(
									sidebar.id,
								);
							}
						}
					}

					iterateControls(newScreen.controls, (control: any) => {
						if (
							control.dynamicAttributes &&
							Object.keys(this.internals.unknownsRequiringSimulate).length > 0
						) {
							if (
								control.dynamicAttributes.some(
									(dynamic: string) =>
										this.internals.unknownsRequiringSimulate[dynamic],
								)
							) {
								control.loading = true;
							}
						}
						if (!control.loading) {
							postProcessControl(
								control,
								this.internals.replacements,
								this.data,
								this.state,
								this.session.locale,
							);
						}
					});

					if (loading) {
						this.internals.latestRequest = Date.now();
					}

					this.triggerUpdate({
						externalLoading: this.externalLoading || loading,
						screen: newScreen,
					});
				}
			}
		}
		this.internals.prevUserValues = structuredClone(this.internals.userValues);
	}

	private makeScreenCopy() {
		return deepClone(
			this.processedScreen ? this.processedScreen : this.session.screen,
		);
	}

	private async updateDynamicValues() {
		let newScreen: Screen | undefined;
		if (
			Object.keys(this.internals.unknownsRequiringSimulate).length > 0 &&
			this.session.screen
		) {
			const requestId = this.internals.latestRequest;

			const result = await simulate(
				Object.values(this.internals.unknownsRequiringSimulate),
				this.api,
				this,
			);

			// are we still the last request?
			if (this.internals.latestRequest === requestId) {
				newScreen = this.makeScreenCopy();

				// ask the backend to solve for any dynamic attributes, based on the entered attributes
				Object.assign(this.internals.replacements, result);

				if (this.debug) {
					console.log(
						"[@decisively-io/interview-sdk] DEBUG: Got replacements",
						JSON.stringify(newScreen.controls, null, 2),
						this.internals.replacements,
					);
				}

				// replace anything replaceable on the screen
				if (newScreen?.controls) {
					iterateControls(newScreen.controls, (control: any) => {
						if (control.loading) {
							control.loading = undefined;
						}

						postProcessControl(
							control,
							this.internals.replacements,
							this.data,
							this.state,
							this.session.locale,
						);
					});
				}

				this.internals.unknownsAlreadySimulated = {
					...this.internals.unknownsRequiringSimulate,
				};
				this.internals.unknownsRequiringSimulate = {};
			}
		}

		if (this.internals.sidebarSimulate) {
			const result = await postSimulate(
				this.api,
				this,
				this.internals.sidebarSimulate.simulate,
			);
			for (const sidebarId of this.internals.sidebarSimulate.ids) {
				if (!newScreen) {
					newScreen = this.makeScreenCopy();
				}

				const screenSidebar = newScreen.sidebars?.find(
					(s) => s.id === sidebarId,
				);
				if (screenSidebar) {
					const dataInfo = (SIDEBAR_DYNAMIC_DATA_INFO as any)[
						screenSidebar.type
					];
					if (dataInfo) {
						try {
							Object.assign(
								screenSidebar.data,
								dataInfo.generateData(screenSidebar.config, result),
							);
						} catch (error) {
							console.error(
								"[@decisively-io/interview-sdk] Error generating sidebar data",
								error,
							);
						}
					}
					screenSidebar.loading = false;
				}
			}
		}

		const nextButton = this.screen.buttons?.next;
		if (nextButton && typeof nextButton === "object") {
			this.internals.canProgress = nextButton.dependencies.every(
				(attr) =>
					(this.internals.userValues[attr] ||
						this.internals.replacements[attr]) === true,
			);
		}

		if (newScreen) {
			this.triggerUpdate({
				externalLoading: false,
				screen: newScreen,
			});
		}
	}

	private updateSession(session: Session) {
		const prevSession = this.session;
		const currentRenderAt = this.renderAt;
		this.session = session;
		if (!isEmpty(session.screen)) {
			const replacements: AttributeValues = {};
			if (session.state) {
				for (const stateObj of session.state) {
					if (replacements[stateObj.id] === undefined && stateObj.value) {
						replacements[stateObj.id] = stateObj.value;
					}
				}
			}
			if (prevSession?.screen?.id !== session.screen?.id) {
				const nextButton = session.screen.buttons?.next;
				let canProgress = true;
				if (nextButton && typeof nextButton === "object") {
					canProgress = nextButton.defaultEnabled;
				}

				this.internals = {
					userValues: {},
					prevUserValues: {},
					replacements: replacements,
					unknownsRequiringSimulate: {},
					unknownsAlreadySimulated: {},
					latestRequest: undefined,
					sidebarSimulate: undefined,
					canProgress: canProgress,
				};
			}
			/*this.processedScreen = produce(session.screen as Screen, (draft) => {
        iterateControls(draft.controls, (control: any) => {
          postProcessControl(control, this.internals.replacements);
        });
      });

      // call this first so the debounce doesn't fire during unknown calculation
      this.updateDynamicValues();
      this.calculateUnknowns();

      // force trigger an update of dynamic values
      // @ts-ignore
      this.updateDynamicValues.flush();*/
		}

		// hasn't updated, force it
		if (currentRenderAt === this.renderAt) {
			this.triggerUpdate({
				screen: session.screen,
			});
		}
	}

	get canProgress() {
		return this.internals.canProgress;
	}

	// -- session getters

	get status() {
		return this.session.status;
	}

	get sessionId() {
		return this.session.sessionId;
	}

	get screen() {
		return this.processedScreen ?? this.session.screen;
	}

	get state() {
		return this.session.state;
	}

	get context() {
		return this.session.context;
	}

	get data() {
		return this.session.data;
	}

	get steps() {
		return this.session.steps;
	}

	get progress() {
		return this.session.progress;
	}

	get explanations() {
		return this.session.explanations;
	}

	get graph() {
		return (this.session as any).graph;
	}

	set graph(graph) {
		(this.session as any).graph = graph;
	}

	get reporting() {
		return (this.session as any).reporting;
	}

	get report() {
		return (this.session as any).report;
	}

	set report(report) {
		(this.session as any).report = report;
	}

	// -- methods

	async submit(
		data: AttributeValues,
		navigate?: any,
		overrides: Overrides = {},
	) {
		this.triggerUpdate({ externalLoading: true });
		this.updateSession(
			await submit(
				this.api,
				this,
				transformResponse(this, data as any),
				navigate,
				{
					response: this.options.responseElements,
					...overrides,
				},
			),
		);
		this.triggerUpdate({ externalLoading: false });
		return this;
	}

	async chat(
		goal: string,
		message: string,
		interactionId?: string | null,
		overrides?: Overrides,
	): Promise<ChatResponse> {
		try {
			this.triggerUpdate({ externalLoading: true });
			const payload = await chat(
				this.api,
				this,
				message,
				goal,
				overrides,
				interactionId,
			);
			this.triggerUpdate({ externalLoading: false });
			return payload;
		} catch (error) {
			this.triggerUpdate({ externalLoading: false });
			throw error;
		}
	}

	async save(data: AttributeValues) {
		this.triggerUpdate({ externalLoading: true });
		this.updateSession(
			await submit(
				this.api,
				this,
				transformResponse(this, data as any),
				false,
				{
					response: this.options.responseElements,
				},
			),
		);
		this.triggerUpdate({ externalLoading: false });
		return this;
	}

	async navigate(step: StepId) {
		this.triggerUpdate({ externalLoading: true });
		this.updateSession(await navigate(this.api, this, step));
		this.triggerUpdate({ externalLoading: false });
		return this;
	}

	async back() {
		this.triggerUpdate({ externalLoading: true });
		this.updateSession(await back(this.api, this));
		this.triggerUpdate({ externalLoading: false });
		return this;
	}

	exportTimeline() {
		return exportTimeline(this.api, this);
	}

	// ----- File control utils

	uploadFile: NonNullable<SessionInstanceOptions["uploadFile"]> = async (
		arg,
	) => {
		const { data } = await this.options.fileApi.post("", arg);

		return data;
	};

	downloadFile = async (ref: any) => {
		let result: any;
		try {
			result = await this.options.fileApi.get(getIdFromFileAttributeRef(ref));
		} catch (e) {
			// anything else -> some other type of problem -> signal to user
			console.error("x23rqPx3PO | interview-sdk, remove file error", e);
			throw e;
		}
		return result.data;
	};

	removeFile: NonNullable<SessionInstanceOptions["removeFile"]> = async (
		ref,
	) => {
		try {
			await this.options.fileApi.delete(getIdFromFileAttributeRef(ref));
		} catch (e) {
			if (
				get(e, ["response", "data", "message"], "") ===
				"Unable to retrieve data - check the file reference"
			) {
				/**
				 * this is an expected error which means that file is in staging area \
				 * and so we can't remove it using delete, but it will be removed automatically\
				 * after some time
				 */
				return;
			}

			// anything else -> some other type of problem -> signal to user
			console.error("x23rqPx3PO | interview-sdk, remove file error", e);
			throw e;
		}
	};

	onFileTooBig: NonNullable<SessionInstanceOptions["onFileTooBig"]> = (
		file,
	) => {
		console.error("cp9GiRdMeO | interview-sdk, onFileTooBig", file);
	};
}

export type SessionObservable = Partial<SessionInstance>;

export type InitConfigFileUtils = {
	filePath?: string[];
	uploadFile?: FileCtrlTypesNS.UploadFile;
	removeFile?: FileCtrlTypesNS.RemoveFile;
	onFileTooBig?: FileCtrlTypesNS.OnFileTooBig;
};
export type InitConfig = {
	host: string;
	path?: string | string[];
	overrides?: AxiosRequestConfig;
	fileUtils?: InitConfigFileUtils;
};
const initCore = (config: InitConfig): InterviewProvider => {
	const { host, overrides = {}, path = defaultPath, fileUtils = {} } = config;
	// -- create the api instance
	const baseUrl = buildUrl(host, ...(typeof path === "string" ? [path] : path));
	const api = createApiInstance(baseUrl, overrides);
	const { filePath = defaultFilePath, ...fileUtilsOverride } = fileUtils;
	const fileBaseUrl = buildUrl(host, ...filePath);
	const fileApi = createApiInstance(fileBaseUrl, overrides);

	// -- ret
	const provider: InterviewProvider = {
		create: async (project, config, newDataCallback?) => {
			// @ts-ignore
			const session = await create(api, project, {
				...config,
				debug: undefined,
			});
			return new SessionInstance({
				provider,
				session: session,
				api,
				responseElements: config.responseElements,
				project,
				newDataCallback,
				fileApi,
				index: config.index,
				...fileUtilsOverride,
				...config,
			});
		},
		load: async (project, sessionId, interactionId) => {
			const session = await load(api, project, sessionId, interactionId);
			return new SessionInstance({
				provider,
				session,
				api,
				project,
				fileApi,
				...fileUtilsOverride,
			});
		},
		finish: () => {},
	};

	return provider;
};

/** Initialise the interview SDK */
export function init(config: InitConfig): InterviewProvider;
/** @deprecated Use `init(config: InitConfig)` */
export function init(
	host: string,
	path?: string | string[],
	overrides?: AxiosRequestConfig,
	fileUtils?: InitConfigFileUtils,
): InterviewProvider;

export function init(
	hostOrConfig: string | InitConfig,
	path?: string | string[],
	overrides?: AxiosRequestConfig,
	fileUtils?: InitConfigFileUtils,
): InterviewProvider {
	const config: InitConfig =
		typeof hostOrConfig !== "string"
			? hostOrConfig
			: {
					host: hostOrConfig,
					path,
					overrides,
					fileUtils,
				};

	return initCore(config);
}
