import { updateReportingWithReplacements } from "../manager";
import { createEntityPathedData } from "../util";

const xit = (name, fn) => {};

xit("1.", () => {
	const reporting = {
		employees: {
			1: {
				jobs: {
					1: {
						occupancies: {
							1: {
								timesheet_workdays: {
									"2025-07-14": {
										timesheet_entries: {
											new: {
												timesheet_breaks: {
													"20568a0e-2257-4c59-be59-34ef694d915a": {
														"0af872be-9ea6-48c5-a505-30d934cae731": "00:12:12",
														"1af872be-9ea6-48c5-a505-30d934cae731": 2,
														"73869e96-79b8-424d-88f8-a9e4c530ab03": "18:14:14",
														timesheet_super_breaks: {
															1: {
																a: 1,
																b: "hi",
															},
														},
													},
												},
												"c940c62f-2091-4534-92f7-b065fcceee45": 0,
												"37d92a5a-b5f7-43d7-93e6-3716c3a66dd3": 0,
												"653f32b8-ad19-426e-9877-a816704fdb8f": 0,
												"d99a3ee9-3487-4ee5-8a3b-d3e7e7f16644": 0,
												"283a1d35-082c-45d7-b43d-f9bc79287ea9": 0,
												"d1cfd690-9b8c-4b23-abea-e3f7ea31ff78": 0,
											},
										},
									},
								},
							},
						},
					},
				},
			},
		},
	};

	const replacements = {
		"fb5a8481-5d49-4b07-b835-9b81f84f4b90": "work",
		"ec9ece38-ddb6-4ab2-89d6-134d0eb51946": false,
		"03fd1227-3c29-4388-bfa2-054d50c56c3e": "",
		timesheet_breaks: [
			{
				"@id": "20568a0e-2257-4c59-be59-34ef694d915a",
				"0af872be-9ea6-48c5-a505-30d934cae731": "12:12:12",
				"73869e96-79b8-424d-88f8-a9e4c530ab03": "18:14:14",
				"other thing we don't care about": 12,
			},
		],
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/timesheet_breaks/1/timesheet_super_breaks/1/a": 12,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/0169d3b8-c30e-43db-b714-09eeb1aef56d":
			null,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/a524fca7-d2b2-4a9f-8314-3fd687e4546c": true,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/157334fe-fe8c-477e-8d61-eb6a4f2888e2": false,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/5c6f3d23-6732-4868-b51b-0979d91b6204": false,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/e97be1b5-6d7f-404b-9ab0-676a00e678f7": false,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/d3fa158d-ff05-444b-a036-b59f45dbb86e": false,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/479c8336-ccec-45fb-ade3-4aeddc411323": false,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/879519ba-3693-4896-a10d-d91ff4be19a0": false,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/ebdd8038-33b1-4494-b178-182bdac9ea49": false,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/219c670d-5ebf-4646-90be-6eb2a969cbb6":
			null,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/456d7ad3-f8b9-4d95-8456-e710cc799c1b":
			null,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/9bdc4b45-261a-4039-a992-2e3e0aca9f12": false,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/feb296ec-eeb5-4b85-becf-cc33e562c42d": false,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/00cef9c4-5b14-4112-be51-c95c53ac2a00": false,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/fcf4a75d-eb84-48b2-bb2b-90d7d577be80": false,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/c940c62f-2091-4534-92f7-b065fcceee45": 1,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/37d92a5a-b5f7-43d7-93e6-3716c3a66dd3": 2,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/653f32b8-ad19-426e-9877-a816704fdb8f": 3,
		"d99a3ee9-3487-4ee5-8a3b-d3e7e7f16644": 4,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/283a1d35-082c-45d7-b43d-f9bc79287ea9": 5,
		"d1cfd690-9b8c-4b23-abea-e3f7ea31ff78": 6,
		"d2a67f06-5b7b-4768-8862-4eb52ef44066": false,
		"timesheet_breaks/20568a0e-2257-4c59-be59-34ef694d915a/73869e96-79b8-424d-88f8-a9e4c530ab03":
			"18:14:14",
		"bba8376f-4d83-4018-96c1-3c8254c1086a": "02:04:04",
		"e5f9fdf0-0ce3-47ee-93ba-7fda07fc77f7": "08:08:08",
		"1e057408-abdc-40d9-9602-4d12de98a016": false,
	};

	const result = updateReportingWithReplacements(
		reporting,
		replacements,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new",
	);

	expect(result).toEqual({
		employees: {
			1: {
				jobs: {
					1: {
						occupancies: {
							1: {
								timesheet_workdays: {
									"2025-07-14": {
										timesheet_entries: {
											new: {
												timesheet_breaks: {
													"20568a0e-2257-4c59-be59-34ef694d915a": {
														"0af872be-9ea6-48c5-a505-30d934cae731": "12:12:12",
														"1af872be-9ea6-48c5-a505-30d934cae731": 2,
														"73869e96-79b8-424d-88f8-a9e4c530ab03": "18:14:14",
														timesheet_super_breaks: {
															1: {
																a: 1,
																b: "hi",
															},
														},
													},
												},
												"c940c62f-2091-4534-92f7-b065fcceee45": 1,
												"37d92a5a-b5f7-43d7-93e6-3716c3a66dd3": 2,
												"653f32b8-ad19-426e-9877-a816704fdb8f": 3,
												"d99a3ee9-3487-4ee5-8a3b-d3e7e7f16644": 4,
												"283a1d35-082c-45d7-b43d-f9bc79287ea9": 5,
												"d1cfd690-9b8c-4b23-abea-e3f7ea31ff78": 6,
											},
										},
									},
								},
							},
						},
					},
				},
			},
		},
	});
});

it("2.", () => {
	const reporting = {
		global: {},
		employees: [
			{
				"@id": "1",
				jobs: [
					{
						"@id": "1",
						occupancies: [
							{
								"@id": "1",
								timesheet_workdays: [
									{
										"@id": "2025-07-14",
										timesheet_entries: [
											{
												"@id": "new",
												"5b5ceb88-6496-4c0c-96d2-a8397bb3d025": false,
												"e97be1b5-6d7f-404b-9ab0-676a00e678f7": false,
												"157334fe-fe8c-477e-8d61-eb6a4f2888e2": false,
												"d3fa158d-ff05-444b-a036-b59f45dbb86e": false,
												"00cef9c4-5b14-4112-be51-c95c53ac2a00": false,
												"0169d3b8-c30e-43db-b714-09eeb1aef56d": null,
												"fcf4a75d-eb84-48b2-bb2b-90d7d577be80": false,
												"21a703e8-9a35-4f68-b9cb-bd5b6907e85a": false,
												"a524fca7-d2b2-4a9f-8314-3fd687e4546c": true,
												"479c8336-ccec-45fb-ade3-4aeddc411323": false,
												"7fd3c15a-b98f-415e-b609-e0243d98ddd9": true,
												"1fd2351b-a0eb-4dc3-831b-316195e05121": false,
												"879519ba-3693-4896-a10d-d91ff4be19a0": true,
												"37d92a5a-b5f7-43d7-93e6-3716c3a66dd3": 11.266666666666667,
												"ee94d99e-8f3f-4ed5-8db3-cf2aae9f5978": true,
												"ebdd8038-33b1-4494-b178-182bdac9ea49": false,
												"219c670d-5ebf-4646-90be-6eb2a969cbb6": "Zero",
												"456d7ad3-f8b9-4d95-8456-e710cc799c1b": 0,
												"9bdc4b45-261a-4039-a992-2e3e0aca9f12": false,
												"feb296ec-eeb5-4b85-becf-cc33e562c42d": false,
												"5c6f3d23-6732-4868-b51b-0979d91b6204": false,
												"c940c62f-2091-4534-92f7-b065fcceee45": 10,
												"653f32b8-ad19-426e-9877-a816704fdb8f": 0,
												"d99a3ee9-3487-4ee5-8a3b-d3e7e7f16644": 21.033333333333335,
												"283a1d35-082c-45d7-b43d-f9bc79287ea9": 0,
												"d1cfd690-9b8c-4b23-abea-e3f7ea31ff78": 0,
												"e2866d65-0bf0-4f0c-abe7-46d1ae9b683c": false,
												"6da1a6c3-ddfc-44b7-a849-8059622efcb8": false,
												"2560f783-20c9-46b4-8708-5166298f263e": false,
												"11bca982-bfce-4697-81cc-4e47834cf1a9": false,
											},
										],
									},
								],
								"e1c2a055-414d-4e6f-8a16-b32548fe4e56": 0,
								"2505bac1-1f62-4c2e-8573-475d49b88a68": false,
							},
							{
								"@id": "2",
								"2505bac1-1f62-4c2e-8573-475d49b88a68": false,
							},
						],
					},
				],
				pay_period_days: [
					{
						"@id": "1",
						"8929f51d-e350-4af6-abcf-bcea48076452": false,
					},
					{
						"@id": "2",
						"8929f51d-e350-4af6-abcf-bcea48076452": false,
					},
					{
						"@id": "3",
						"8929f51d-e350-4af6-abcf-bcea48076452": false,
					},
					{
						"@id": "4",
						"8929f51d-e350-4af6-abcf-bcea48076452": false,
					},
					{
						"@id": "5",
						"8929f51d-e350-4af6-abcf-bcea48076452": false,
					},
					{
						"@id": "6",
						"8929f51d-e350-4af6-abcf-bcea48076452": false,
					},
					{
						"@id": "7",
						"8929f51d-e350-4af6-abcf-bcea48076452": false,
					},
					{
						"@id": "8",
						"8929f51d-e350-4af6-abcf-bcea48076452": false,
					},
					{
						"@id": "9",
						"8929f51d-e350-4af6-abcf-bcea48076452": false,
					},
					{
						"@id": "10",
						"8929f51d-e350-4af6-abcf-bcea48076452": false,
					},
					{
						"@id": "11",
						"8929f51d-e350-4af6-abcf-bcea48076452": false,
					},
					{
						"@id": "12",
						"8929f51d-e350-4af6-abcf-bcea48076452": false,
					},
					{
						"@id": "13",
						"8929f51d-e350-4af6-abcf-bcea48076452": false,
					},
					{
						"@id": "14",
						"8929f51d-e350-4af6-abcf-bcea48076452": false,
					},
				],
				"87a09914-36a2-4205-92c7-830bf1a04588": false,
				"1b18849d-c9c6-45ea-9746-48321dc20920": false,
				"b7dba1f3-ca7a-416a-9a8f-b57bfc3d7b43": false,
				"2b60c8b3-0cad-4d0b-bb7d-58343e7e56e8": false,
				"c1c59007-0478-4e0e-bece-712f382c22e3": false,
				"df668273-7e21-4994-92fb-f4b3f5936725": false,
			},
		],
	};

	const replacements = createEntityPathedData(reporting);

	expect(replacements).toEqual({
		global: {},
		employees: [
			{
				"@id": "1",
				jobs: [
					{
						"@id": "1",
						occupancies: [
							{
								"@id": "1",
								timesheet_workdays: [
									{
										"@id": "2025-07-14",
										timesheet_entries: [
											{
												"@id": "new",
												"5b5ceb88-6496-4c0c-96d2-a8397bb3d025": false,
												"e97be1b5-6d7f-404b-9ab0-676a00e678f7": false,
												"157334fe-fe8c-477e-8d61-eb6a4f2888e2": false,
												"d3fa158d-ff05-444b-a036-b59f45dbb86e": false,
												"00cef9c4-5b14-4112-be51-c95c53ac2a00": false,
												"0169d3b8-c30e-43db-b714-09eeb1aef56d": null,
												"fcf4a75d-eb84-48b2-bb2b-90d7d577be80": false,
												"21a703e8-9a35-4f68-b9cb-bd5b6907e85a": false,
												"a524fca7-d2b2-4a9f-8314-3fd687e4546c": true,
												"479c8336-ccec-45fb-ade3-4aeddc411323": false,
												"7fd3c15a-b98f-415e-b609-e0243d98ddd9": true,
												"1fd2351b-a0eb-4dc3-831b-316195e05121": false,
												"879519ba-3693-4896-a10d-d91ff4be19a0": true,
												"37d92a5a-b5f7-43d7-93e6-3716c3a66dd3": 11.266666666666667,
												"ee94d99e-8f3f-4ed5-8db3-cf2aae9f5978": true,
												"ebdd8038-33b1-4494-b178-182bdac9ea49": false,
												"219c670d-5ebf-4646-90be-6eb2a969cbb6": "Zero",
												"456d7ad3-f8b9-4d95-8456-e710cc799c1b": 0,
												"9bdc4b45-261a-4039-a992-2e3e0aca9f12": false,
												"feb296ec-eeb5-4b85-becf-cc33e562c42d": false,
												"5c6f3d23-6732-4868-b51b-0979d91b6204": false,
												"c940c62f-2091-4534-92f7-b065fcceee45": 10,
												"653f32b8-ad19-426e-9877-a816704fdb8f": 0,
												"d99a3ee9-3487-4ee5-8a3b-d3e7e7f16644": 21.033333333333335,
												"283a1d35-082c-45d7-b43d-f9bc79287ea9": 0,
												"d1cfd690-9b8c-4b23-abea-e3f7ea31ff78": 0,
												"e2866d65-0bf0-4f0c-abe7-46d1ae9b683c": false,
												"6da1a6c3-ddfc-44b7-a849-8059622efcb8": false,
												"2560f783-20c9-46b4-8708-5166298f263e": false,
												"11bca982-bfce-4697-81cc-4e47834cf1a9": false,
											},
										],
									},
								],
								"e1c2a055-414d-4e6f-8a16-b32548fe4e56": 0,
								"2505bac1-1f62-4c2e-8573-475d49b88a68": false,
							},
							{
								"@id": "2",
								"2505bac1-1f62-4c2e-8573-475d49b88a68": false,
							},
						],
					},
				],
				pay_period_days: [
					{
						"@id": "1",
						"8929f51d-e350-4af6-abcf-bcea48076452": false,
					},
					{
						"@id": "2",
						"8929f51d-e350-4af6-abcf-bcea48076452": false,
					},
					{
						"@id": "3",
						"8929f51d-e350-4af6-abcf-bcea48076452": false,
					},
					{
						"@id": "4",
						"8929f51d-e350-4af6-abcf-bcea48076452": false,
					},
					{
						"@id": "5",
						"8929f51d-e350-4af6-abcf-bcea48076452": false,
					},
					{
						"@id": "6",
						"8929f51d-e350-4af6-abcf-bcea48076452": false,
					},
					{
						"@id": "7",
						"8929f51d-e350-4af6-abcf-bcea48076452": false,
					},
					{
						"@id": "8",
						"8929f51d-e350-4af6-abcf-bcea48076452": false,
					},
					{
						"@id": "9",
						"8929f51d-e350-4af6-abcf-bcea48076452": false,
					},
					{
						"@id": "10",
						"8929f51d-e350-4af6-abcf-bcea48076452": false,
					},
					{
						"@id": "11",
						"8929f51d-e350-4af6-abcf-bcea48076452": false,
					},
					{
						"@id": "12",
						"8929f51d-e350-4af6-abcf-bcea48076452": false,
					},
					{
						"@id": "13",
						"8929f51d-e350-4af6-abcf-bcea48076452": false,
					},
					{
						"@id": "14",
						"8929f51d-e350-4af6-abcf-bcea48076452": false,
					},
				],
				"87a09914-36a2-4205-92c7-830bf1a04588": false,
				"1b18849d-c9c6-45ea-9746-48321dc20920": false,
				"b7dba1f3-ca7a-416a-9a8f-b57bfc3d7b43": false,
				"2b60c8b3-0cad-4d0b-bb7d-58343e7e56e8": false,
				"c1c59007-0478-4e0e-bece-712f382c22e3": false,
				"df668273-7e21-4994-92fb-f4b3f5936725": false,
			},
		],
		"employees/1/@id": "1",
		"employees/1/jobs": [
			{
				"@id": "1",
				occupancies: [
					{
						"@id": "1",
						timesheet_workdays: [
							{
								"@id": "2025-07-14",
								timesheet_entries: [
									{
										"@id": "new",
										"5b5ceb88-6496-4c0c-96d2-a8397bb3d025": false,
										"e97be1b5-6d7f-404b-9ab0-676a00e678f7": false,
										"157334fe-fe8c-477e-8d61-eb6a4f2888e2": false,
										"d3fa158d-ff05-444b-a036-b59f45dbb86e": false,
										"00cef9c4-5b14-4112-be51-c95c53ac2a00": false,
										"0169d3b8-c30e-43db-b714-09eeb1aef56d": null,
										"fcf4a75d-eb84-48b2-bb2b-90d7d577be80": false,
										"21a703e8-9a35-4f68-b9cb-bd5b6907e85a": false,
										"a524fca7-d2b2-4a9f-8314-3fd687e4546c": true,
										"479c8336-ccec-45fb-ade3-4aeddc411323": false,
										"7fd3c15a-b98f-415e-b609-e0243d98ddd9": true,
										"1fd2351b-a0eb-4dc3-831b-316195e05121": false,
										"879519ba-3693-4896-a10d-d91ff4be19a0": true,
										"37d92a5a-b5f7-43d7-93e6-3716c3a66dd3": 11.266666666666667,
										"ee94d99e-8f3f-4ed5-8db3-cf2aae9f5978": true,
										"ebdd8038-33b1-4494-b178-182bdac9ea49": false,
										"219c670d-5ebf-4646-90be-6eb2a969cbb6": "Zero",
										"456d7ad3-f8b9-4d95-8456-e710cc799c1b": 0,
										"9bdc4b45-261a-4039-a992-2e3e0aca9f12": false,
										"feb296ec-eeb5-4b85-becf-cc33e562c42d": false,
										"5c6f3d23-6732-4868-b51b-0979d91b6204": false,
										"c940c62f-2091-4534-92f7-b065fcceee45": 10,
										"653f32b8-ad19-426e-9877-a816704fdb8f": 0,
										"d99a3ee9-3487-4ee5-8a3b-d3e7e7f16644": 21.033333333333335,
										"283a1d35-082c-45d7-b43d-f9bc79287ea9": 0,
										"d1cfd690-9b8c-4b23-abea-e3f7ea31ff78": 0,
										"e2866d65-0bf0-4f0c-abe7-46d1ae9b683c": false,
										"6da1a6c3-ddfc-44b7-a849-8059622efcb8": false,
										"2560f783-20c9-46b4-8708-5166298f263e": false,
										"11bca982-bfce-4697-81cc-4e47834cf1a9": false,
									},
								],
							},
						],
						"e1c2a055-414d-4e6f-8a16-b32548fe4e56": 0,
						"2505bac1-1f62-4c2e-8573-475d49b88a68": false,
					},
					{
						"@id": "2",
						"2505bac1-1f62-4c2e-8573-475d49b88a68": false,
					},
				],
			},
		],
		"employees/1/jobs/1/@id": "1",
		"employees/1/jobs/1/occupancies": [
			{
				"@id": "1",
				timesheet_workdays: [
					{
						"@id": "2025-07-14",
						timesheet_entries: [
							{
								"@id": "new",
								"5b5ceb88-6496-4c0c-96d2-a8397bb3d025": false,
								"e97be1b5-6d7f-404b-9ab0-676a00e678f7": false,
								"157334fe-fe8c-477e-8d61-eb6a4f2888e2": false,
								"d3fa158d-ff05-444b-a036-b59f45dbb86e": false,
								"00cef9c4-5b14-4112-be51-c95c53ac2a00": false,
								"0169d3b8-c30e-43db-b714-09eeb1aef56d": null,
								"fcf4a75d-eb84-48b2-bb2b-90d7d577be80": false,
								"21a703e8-9a35-4f68-b9cb-bd5b6907e85a": false,
								"a524fca7-d2b2-4a9f-8314-3fd687e4546c": true,
								"479c8336-ccec-45fb-ade3-4aeddc411323": false,
								"7fd3c15a-b98f-415e-b609-e0243d98ddd9": true,
								"1fd2351b-a0eb-4dc3-831b-316195e05121": false,
								"879519ba-3693-4896-a10d-d91ff4be19a0": true,
								"37d92a5a-b5f7-43d7-93e6-3716c3a66dd3": 11.266666666666667,
								"ee94d99e-8f3f-4ed5-8db3-cf2aae9f5978": true,
								"ebdd8038-33b1-4494-b178-182bdac9ea49": false,
								"219c670d-5ebf-4646-90be-6eb2a969cbb6": "Zero",
								"456d7ad3-f8b9-4d95-8456-e710cc799c1b": 0,
								"9bdc4b45-261a-4039-a992-2e3e0aca9f12": false,
								"feb296ec-eeb5-4b85-becf-cc33e562c42d": false,
								"5c6f3d23-6732-4868-b51b-0979d91b6204": false,
								"c940c62f-2091-4534-92f7-b065fcceee45": 10,
								"653f32b8-ad19-426e-9877-a816704fdb8f": 0,
								"d99a3ee9-3487-4ee5-8a3b-d3e7e7f16644": 21.033333333333335,
								"283a1d35-082c-45d7-b43d-f9bc79287ea9": 0,
								"d1cfd690-9b8c-4b23-abea-e3f7ea31ff78": 0,
								"e2866d65-0bf0-4f0c-abe7-46d1ae9b683c": false,
								"6da1a6c3-ddfc-44b7-a849-8059622efcb8": false,
								"2560f783-20c9-46b4-8708-5166298f263e": false,
								"11bca982-bfce-4697-81cc-4e47834cf1a9": false,
							},
						],
					},
				],
				"e1c2a055-414d-4e6f-8a16-b32548fe4e56": 0,
				"2505bac1-1f62-4c2e-8573-475d49b88a68": false,
			},
			{
				"@id": "2",
				"2505bac1-1f62-4c2e-8573-475d49b88a68": false,
			},
		],
		"employees/1/jobs/1/occupancies/1/@id": "1",
		"employees/1/jobs/1/occupancies/1/timesheet_workdays": [
			{
				"@id": "2025-07-14",
				timesheet_entries: [
					{
						"@id": "new",
						"5b5ceb88-6496-4c0c-96d2-a8397bb3d025": false,
						"e97be1b5-6d7f-404b-9ab0-676a00e678f7": false,
						"157334fe-fe8c-477e-8d61-eb6a4f2888e2": false,
						"d3fa158d-ff05-444b-a036-b59f45dbb86e": false,
						"00cef9c4-5b14-4112-be51-c95c53ac2a00": false,
						"0169d3b8-c30e-43db-b714-09eeb1aef56d": null,
						"fcf4a75d-eb84-48b2-bb2b-90d7d577be80": false,
						"21a703e8-9a35-4f68-b9cb-bd5b6907e85a": false,
						"a524fca7-d2b2-4a9f-8314-3fd687e4546c": true,
						"479c8336-ccec-45fb-ade3-4aeddc411323": false,
						"7fd3c15a-b98f-415e-b609-e0243d98ddd9": true,
						"1fd2351b-a0eb-4dc3-831b-316195e05121": false,
						"879519ba-3693-4896-a10d-d91ff4be19a0": true,
						"37d92a5a-b5f7-43d7-93e6-3716c3a66dd3": 11.266666666666667,
						"ee94d99e-8f3f-4ed5-8db3-cf2aae9f5978": true,
						"ebdd8038-33b1-4494-b178-182bdac9ea49": false,
						"219c670d-5ebf-4646-90be-6eb2a969cbb6": "Zero",
						"456d7ad3-f8b9-4d95-8456-e710cc799c1b": 0,
						"9bdc4b45-261a-4039-a992-2e3e0aca9f12": false,
						"feb296ec-eeb5-4b85-becf-cc33e562c42d": false,
						"5c6f3d23-6732-4868-b51b-0979d91b6204": false,
						"c940c62f-2091-4534-92f7-b065fcceee45": 10,
						"653f32b8-ad19-426e-9877-a816704fdb8f": 0,
						"d99a3ee9-3487-4ee5-8a3b-d3e7e7f16644": 21.033333333333335,
						"283a1d35-082c-45d7-b43d-f9bc79287ea9": 0,
						"d1cfd690-9b8c-4b23-abea-e3f7ea31ff78": 0,
						"e2866d65-0bf0-4f0c-abe7-46d1ae9b683c": false,
						"6da1a6c3-ddfc-44b7-a849-8059622efcb8": false,
						"2560f783-20c9-46b4-8708-5166298f263e": false,
						"11bca982-bfce-4697-81cc-4e47834cf1a9": false,
					},
				],
			},
		],
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/@id":
			"2025-07-14",
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries":
			[
				{
					"@id": "new",
					"5b5ceb88-6496-4c0c-96d2-a8397bb3d025": false,
					"e97be1b5-6d7f-404b-9ab0-676a00e678f7": false,
					"157334fe-fe8c-477e-8d61-eb6a4f2888e2": false,
					"d3fa158d-ff05-444b-a036-b59f45dbb86e": false,
					"00cef9c4-5b14-4112-be51-c95c53ac2a00": false,
					"0169d3b8-c30e-43db-b714-09eeb1aef56d": null,
					"fcf4a75d-eb84-48b2-bb2b-90d7d577be80": false,
					"21a703e8-9a35-4f68-b9cb-bd5b6907e85a": false,
					"a524fca7-d2b2-4a9f-8314-3fd687e4546c": true,
					"479c8336-ccec-45fb-ade3-4aeddc411323": false,
					"7fd3c15a-b98f-415e-b609-e0243d98ddd9": true,
					"1fd2351b-a0eb-4dc3-831b-316195e05121": false,
					"879519ba-3693-4896-a10d-d91ff4be19a0": true,
					"37d92a5a-b5f7-43d7-93e6-3716c3a66dd3": 11.266666666666667,
					"ee94d99e-8f3f-4ed5-8db3-cf2aae9f5978": true,
					"ebdd8038-33b1-4494-b178-182bdac9ea49": false,
					"219c670d-5ebf-4646-90be-6eb2a969cbb6": "Zero",
					"456d7ad3-f8b9-4d95-8456-e710cc799c1b": 0,
					"9bdc4b45-261a-4039-a992-2e3e0aca9f12": false,
					"feb296ec-eeb5-4b85-becf-cc33e562c42d": false,
					"5c6f3d23-6732-4868-b51b-0979d91b6204": false,
					"c940c62f-2091-4534-92f7-b065fcceee45": 10,
					"653f32b8-ad19-426e-9877-a816704fdb8f": 0,
					"d99a3ee9-3487-4ee5-8a3b-d3e7e7f16644": 21.033333333333335,
					"283a1d35-082c-45d7-b43d-f9bc79287ea9": 0,
					"d1cfd690-9b8c-4b23-abea-e3f7ea31ff78": 0,
					"e2866d65-0bf0-4f0c-abe7-46d1ae9b683c": false,
					"6da1a6c3-ddfc-44b7-a849-8059622efcb8": false,
					"2560f783-20c9-46b4-8708-5166298f263e": false,
					"11bca982-bfce-4697-81cc-4e47834cf1a9": false,
				},
			],
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/@id":
			"new",
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/5b5ceb88-6496-4c0c-96d2-a8397bb3d025": false,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/e97be1b5-6d7f-404b-9ab0-676a00e678f7": false,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/157334fe-fe8c-477e-8d61-eb6a4f2888e2": false,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/d3fa158d-ff05-444b-a036-b59f45dbb86e": false,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/00cef9c4-5b14-4112-be51-c95c53ac2a00": false,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/fcf4a75d-eb84-48b2-bb2b-90d7d577be80": false,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/21a703e8-9a35-4f68-b9cb-bd5b6907e85a": false,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/a524fca7-d2b2-4a9f-8314-3fd687e4546c": true,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/479c8336-ccec-45fb-ade3-4aeddc411323": false,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/7fd3c15a-b98f-415e-b609-e0243d98ddd9": true,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/1fd2351b-a0eb-4dc3-831b-316195e05121": false,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/879519ba-3693-4896-a10d-d91ff4be19a0": true,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/37d92a5a-b5f7-43d7-93e6-3716c3a66dd3": 11.266666666666667,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/ee94d99e-8f3f-4ed5-8db3-cf2aae9f5978": true,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/ebdd8038-33b1-4494-b178-182bdac9ea49": false,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/219c670d-5ebf-4646-90be-6eb2a969cbb6":
			"Zero",
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/456d7ad3-f8b9-4d95-8456-e710cc799c1b": 0,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/9bdc4b45-261a-4039-a992-2e3e0aca9f12": false,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/feb296ec-eeb5-4b85-becf-cc33e562c42d": false,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/5c6f3d23-6732-4868-b51b-0979d91b6204": false,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/c940c62f-2091-4534-92f7-b065fcceee45": 10,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/653f32b8-ad19-426e-9877-a816704fdb8f": 0,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/d99a3ee9-3487-4ee5-8a3b-d3e7e7f16644": 21.033333333333335,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/283a1d35-082c-45d7-b43d-f9bc79287ea9": 0,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/d1cfd690-9b8c-4b23-abea-e3f7ea31ff78": 0,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/e2866d65-0bf0-4f0c-abe7-46d1ae9b683c": false,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/6da1a6c3-ddfc-44b7-a849-8059622efcb8": false,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/2560f783-20c9-46b4-8708-5166298f263e": false,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new/11bca982-bfce-4697-81cc-4e47834cf1a9": false,
		"employees/1/jobs/1/occupancies/1/e1c2a055-414d-4e6f-8a16-b32548fe4e56": 0,
		"employees/1/jobs/1/occupancies/1/2505bac1-1f62-4c2e-8573-475d49b88a68": false,
		"employees/1/jobs/1/occupancies/2/@id": "2",
		"employees/1/jobs/1/occupancies/2/2505bac1-1f62-4c2e-8573-475d49b88a68": false,
		"employees/1/pay_period_days": [
			{
				"@id": "1",
				"8929f51d-e350-4af6-abcf-bcea48076452": false,
			},
			{
				"@id": "2",
				"8929f51d-e350-4af6-abcf-bcea48076452": false,
			},
			{
				"@id": "3",
				"8929f51d-e350-4af6-abcf-bcea48076452": false,
			},
			{
				"@id": "4",
				"8929f51d-e350-4af6-abcf-bcea48076452": false,
			},
			{
				"@id": "5",
				"8929f51d-e350-4af6-abcf-bcea48076452": false,
			},
			{
				"@id": "6",
				"8929f51d-e350-4af6-abcf-bcea48076452": false,
			},
			{
				"@id": "7",
				"8929f51d-e350-4af6-abcf-bcea48076452": false,
			},
			{
				"@id": "8",
				"8929f51d-e350-4af6-abcf-bcea48076452": false,
			},
			{
				"@id": "9",
				"8929f51d-e350-4af6-abcf-bcea48076452": false,
			},
			{
				"@id": "10",
				"8929f51d-e350-4af6-abcf-bcea48076452": false,
			},
			{
				"@id": "11",
				"8929f51d-e350-4af6-abcf-bcea48076452": false,
			},
			{
				"@id": "12",
				"8929f51d-e350-4af6-abcf-bcea48076452": false,
			},
			{
				"@id": "13",
				"8929f51d-e350-4af6-abcf-bcea48076452": false,
			},
			{
				"@id": "14",
				"8929f51d-e350-4af6-abcf-bcea48076452": false,
			},
		],
		"employees/1/pay_period_days/1/@id": "1",
		"employees/1/pay_period_days/1/8929f51d-e350-4af6-abcf-bcea48076452": false,
		"employees/1/pay_period_days/2/@id": "2",
		"employees/1/pay_period_days/2/8929f51d-e350-4af6-abcf-bcea48076452": false,
		"employees/1/pay_period_days/3/@id": "3",
		"employees/1/pay_period_days/3/8929f51d-e350-4af6-abcf-bcea48076452": false,
		"employees/1/pay_period_days/4/@id": "4",
		"employees/1/pay_period_days/4/8929f51d-e350-4af6-abcf-bcea48076452": false,
		"employees/1/pay_period_days/5/@id": "5",
		"employees/1/pay_period_days/5/8929f51d-e350-4af6-abcf-bcea48076452": false,
		"employees/1/pay_period_days/6/@id": "6",
		"employees/1/pay_period_days/6/8929f51d-e350-4af6-abcf-bcea48076452": false,
		"employees/1/pay_period_days/7/@id": "7",
		"employees/1/pay_period_days/7/8929f51d-e350-4af6-abcf-bcea48076452": false,
		"employees/1/pay_period_days/8/@id": "8",
		"employees/1/pay_period_days/8/8929f51d-e350-4af6-abcf-bcea48076452": false,
		"employees/1/pay_period_days/9/@id": "9",
		"employees/1/pay_period_days/9/8929f51d-e350-4af6-abcf-bcea48076452": false,
		"employees/1/pay_period_days/10/@id": "10",
		"employees/1/pay_period_days/10/8929f51d-e350-4af6-abcf-bcea48076452": false,
		"employees/1/pay_period_days/11/@id": "11",
		"employees/1/pay_period_days/11/8929f51d-e350-4af6-abcf-bcea48076452": false,
		"employees/1/pay_period_days/12/@id": "12",
		"employees/1/pay_period_days/12/8929f51d-e350-4af6-abcf-bcea48076452": false,
		"employees/1/pay_period_days/13/@id": "13",
		"employees/1/pay_period_days/13/8929f51d-e350-4af6-abcf-bcea48076452": false,
		"employees/1/pay_period_days/14/@id": "14",
		"employees/1/pay_period_days/14/8929f51d-e350-4af6-abcf-bcea48076452": false,
		"employees/1/87a09914-36a2-4205-92c7-830bf1a04588": false,
		"employees/1/1b18849d-c9c6-45ea-9746-48321dc20920": false,
		"employees/1/b7dba1f3-ca7a-416a-9a8f-b57bfc3d7b43": false,
		"employees/1/2b60c8b3-0cad-4d0b-bb7d-58343e7e56e8": false,
		"employees/1/c1c59007-0478-4e0e-bece-712f382c22e3": false,
		"employees/1/df668273-7e21-4994-92fb-f4b3f5936725": false,
	});

	const result = updateReportingWithReplacements(
		{
			employees: {
				1: {
					jobs: {
						1: {
							occupancies: {
								1: {
									timesheet_workdays: {
										"2025-07-14": {
											timesheet_entries: {
												new: {
													"c940c62f-2091-4534-92f7-b065fcceee45": 0,
													"37d92a5a-b5f7-43d7-93e6-3716c3a66dd3": 0,
													"653f32b8-ad19-426e-9877-a816704fdb8f": 0,
													"d99a3ee9-3487-4ee5-8a3b-d3e7e7f16644": 0,
													"283a1d35-082c-45d7-b43d-f9bc79287ea9": 0,
													"d1cfd690-9b8c-4b23-abea-e3f7ea31ff78": 0,
												},
											},
										},
									},
								},
							},
						},
					},
				},
			},
		},
		replacements,
		"employees/1/jobs/1/occupancies/1/timesheet_workdays/2025-07-14/timesheet_entries/new",
	);

	expect(result).toEqual({
		employees: {
			1: {
				jobs: {
					1: {
						occupancies: {
							1: {
								timesheet_workdays: {
									"2025-07-14": {
										timesheet_entries: {
											new: {
												"c940c62f-2091-4534-92f7-b065fcceee45": 10,
												"37d92a5a-b5f7-43d7-93e6-3716c3a66dd3": 11.266666666666667,
												"653f32b8-ad19-426e-9877-a816704fdb8f": 0,
												"d99a3ee9-3487-4ee5-8a3b-d3e7e7f16644": 21.033333333333335,
												"283a1d35-082c-45d7-b43d-f9bc79287ea9": 0,
												"d1cfd690-9b8c-4b23-abea-e3f7ea31ff78": 0,
											},
										},
									},
								},
							},
						},
					},
				},
			},
		},
	});
});
