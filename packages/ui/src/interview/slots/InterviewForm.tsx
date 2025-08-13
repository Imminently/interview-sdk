import {
	getCurrentStep,
	type RenderableControl,
	type Step,
} from "@imminently/interview-sdk";
import { Slot } from "@radix-ui/react-slot";
import debounce from "lodash-es/debounce";
import type React from "react";
import { useEffect, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { RenderControl } from "@/components/RenderControl";
import { useTheme } from "@/providers";
import { cn } from "@/util";
import { useInterview } from "../InterviewContext";

// TODO this only exists for getCurrentStep which is a recursive search
export const DEFAULT_STEP: Step = {
	complete: false,
	context: { entity: "" },
	current: false,
	id: "",
	skipped: false,
	title: "",
	visitable: true,
	visited: false,
	steps: [],
};

export interface InterviewFormProps
	extends React.ButtonHTMLAttributes<HTMLFormElement> {
	asChild?: boolean;
	children?: React.ReactNode;
	className?: string;
	titleClass?: string;
}

/**
 * Renders the controls for the current screen.
 * This is a simple wrapper around the RenderControl component.
 * It maps over the controls and renders each one.
 * It also adds a key to each control to avoid React warnings about unique keys.
 */
export const FormControls = ({
	controls,
}: {
	controls: RenderableControl[];
}) => {
	// pre-fixing key with index, as repeat contains will cause multiple controls with the same id
	return (
		<div data-slot={"controls"} className="flex flex-col gap-4">
			{controls.map((control, index) => (
				<RenderControl key={`${index}-${control.id}`} control={control} />
			))}
		</div>
	);
};

/**
 * Hook to sync form data with the session manager.
 * Updates internals, dynamic values, and calculates unknowns.
 * This is important to ensure the session updates and re-renders the form.
 */
export const useFormSync = (delay: number = 300) => {
	const { watch } = useFormContext();
	const { manager } = useInterview();

	const sync = useMemo(
		() => debounce((value: any) => manager.onScreenDataChange(value), delay),
		[manager, delay],
	);

	useEffect(() => {
		const subscription = watch((value, { type }) => {
			console.log("[FormSync] Watch triggered", type, value);
			if (type === "change") {
				sync(value);
			}
		});

		return () => subscription.unsubscribe();
	}, [watch, sync]);
};

const InterviewForm = ({
	asChild,
	children,
	className,
	titleClass,
	...props
}: InterviewFormProps) => {
	const { t } = useTheme();
	const { session } = useInterview();
	const { steps, screen } = session;

	useFormSync();

	if (!screen) return null;

	const step = getCurrentStep({ ...DEFAULT_STEP, steps });
	const pageTitle = t(screen.title || step?.title || "");
	const Comp = asChild ? Slot : "form";

	return (
		<Comp {...props} className={className} data-slot={"form"}>
			{children ?? (
				<div data-slot={"form-content"}>
					<h4
						data-slot={"heading"}
						className={cn("text-2xl font-semibold mb-6", titleClass)}
					>
						{pageTitle}
					</h4>
					<FormControls controls={screen.controls} />
				</div>
			)}
		</Comp>
	);
};

export { InterviewForm };
