import { type Control, instanceControl, uuid } from "@imminently/interview-sdk";
import { Plus, Trash2 } from "lucide-react";
import React from "react";
import { Controller, get, set, useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "../ui/button";
import { Text } from "../ui/text";
import { cn } from "@/util";
import { useAttributeToFieldName } from "../../util/attribute-to-field-name";
import { RenderControl } from "../RenderControl";
import { AttributeNestingProvider } from "@/providers";

export const EntityFormControl = (props: any) => {
  const { control, className } = props;
  const { entity, instances, template } = control;
  const { control: formControl, getValues, setValue } = useFormContext();

  const parentPath = useAttributeToFieldName((control as any).attribute);
  const name = parentPath ?? entity;

  const { fields } = useFieldArray({
    control: formControl,
    name: name,
  });

  const canAddMore = control.max === undefined || control.max > fields.length;

  const handleAdd = React.useCallback(() => {
    if (canAddMore === false) return;
    const values = getValues();
    const array = get(values, name);
    const id = uuid();
    array.push({
      "@id": id,
    });
    setValue(name, array);
    set(values, name, array);
    control.instances.push(instanceControl(control, id));
    // onScreenDataChange?.(values);
  }, [template, canAddMore]);

  const handleDelete = (index: number) => {
    const values = getValues();
    const array = get(getValues(), name);
    array.splice(index, 1);
    setValue(name, array);
    set(values, name, array);
    control.instances.splice(index, 1);
    // onScreenDataChange?.(values);
  };

  return (
    <div
      className={cn("flex flex-col gap-2", className)}
      data-deci-control={control.type}
      data-deci-id={control.id}
      data-deci-name={name}
    >
      <div className="flex items-center justify-between">
        {
          control.label ? (
            <Text variant="h6">
              {control.label}
            </Text>
          ) : null
        }
        {
          canAddMore ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleAdd}
            >
              <Plus className="h-4 w-4" />
            </Button>
          ) : null
        }
      </div>

      <div className="gap-2">
        <AttributeNestingProvider value={true}>
          {instances?.map((instance: any, index: number, arr: any[]) => {
            const shouldHideDelete = control.min !== undefined && arr.length === control.min;

            return (
              <div
                key={(instance as any)["@id"] ?? instance.id}
                className={cn(
                  "flex items-start justify-between gap-4",
                  index !== arr.length - 1 && "mb-4 pb-4 border-b border-border"
                )}
              >
                <Controller
                  render={() => <React.Fragment />}
                  name={`${name}.${index}.@id`}
                  defaultValue={(instance as any)["@id"] ?? instance.id}
                />
                <div className="flex-1 space-y-4">
                  {instance.controls.map((subControl: any, controlIndex: number) => {
                    if (subControl.type === "typography") {
                      return <RenderControl key={controlIndex} control={subControl} />
                    }

                    if ("attribute" in subControl || subControl.type === "entity") {
                      const key = ((subControl as any).attribute || (subControl as any).entity).split("/").pop();
                      const path = [parentPath ? `${parentPath}.${index}` : `${entity}.${index}`, key]
                        .filter((v) => v !== undefined)
                        .join(".");
                      const childControl = {
                        ...subControl,
                        attribute: path,
                      } as Control;

                      const content = <RenderControl key={controlIndex} control={childControl} />;

                      if (subControl.type === "entity") {
                        return (
                          <div
                            key={controlIndex}
                            className="p-4"
                          >
                            {content}
                          </div>
                        );
                      }
                      return content;
                    }

                    console.log("Unsupported template control", subControl);
                    return null;
                  })}
                </div>

                {shouldHideDelete ? null : (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </AttributeNestingProvider>
      </div>


    </div>
  );
};
