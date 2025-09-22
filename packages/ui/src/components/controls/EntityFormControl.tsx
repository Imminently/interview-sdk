import { useInterview } from "@/interview";
import { AttributeNestingProvider, useTheme } from "@/providers";
import { cn } from "@/util";
import { type Control, type RenderableEntityControl, uuid } from "@imminently/interview-sdk";
import { Plus, Trash2 } from "lucide-react";
import React, { useCallback, useEffect } from "react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { useAttributeToFieldName } from "../../util/attribute-to-field-name";
import { RenderControl } from "../RenderControl";
import { Button } from "../ui/button";
import { Text } from "../ui/text";

export interface EntityFormControlProps {
  control: RenderableEntityControl;
  className?: string;
}

interface FieldControlProps {
  control: RenderableEntityControl;
  index: number;
  parentPath?: string;
}

const FieldControl = ({ control, index, parentPath }: FieldControlProps) => {
  // First check if we have instances with controls for this specific field
  const instanceControls = control.instances?.[index]?.controls;

  const renderInstance = useCallback(
    (subControl: Control, controlIndex: number) => {
      const key = `${controlIndex}-${subControl.id}`;

      if (subControl.type === "typography") {
        return (
          <RenderControl
            key={key}
            control={subControl}
          />
        );
      }

      if ("attribute" in subControl || subControl.type === "entity") {
        // @ts-ignore subControl.entity is not always defined
        const key = (subControl.attribute || subControl.entity)?.split("/").pop();
        if (!key) return null;

        const path = parentPath ? `${parentPath}.${index}.${key}` : `${control.entity}.${index}.${key}`;

        const childControl = {
          ...subControl,
          attribute: path,
        } as Control;

        const content = (
          <RenderControl
            key={key}
            control={childControl}
          />
        );

        if (subControl.type === "entity") {
          return (
            <div
              key={key}
              className="p-4 border border-border rounded-md"
            >
              {content}
            </div>
          );
        }

        return content;
      }

      console.warn("Unsupported instance control", subControl);
      return null;
    },
    [control, index, parentPath],
  );

  if (instanceControls && instanceControls.length > 0) {
    return instanceControls.map(renderInstance);
  }

  // Fallback to template controls if no instance-specific controls
  if (!control.template || control.template.length === 0) return null;

  return control.template.map(renderInstance);
};

export const EntityFormControl = ({ control, className }: EntityFormControlProps) => {
  const { t } = useTheme();
  const { control: formControl } = useFormContext();

  const parentPath = useAttributeToFieldName(control.attribute);
  const fieldName = parentPath ?? control.entity;
  // @ts-ignore check control as we will probably add readOnly in future
  const readOnly = control.readOnly;

  const { fields, append, remove } = useFieldArray({
    control: formControl,
    name: fieldName,
    shouldUnregister: true,
  });

  // Initialize fields from control.instances if they exist and fields array is empty
  const [initialized, setInitialized] = React.useState(false);

  useEffect(() => {
    if (!initialized && fields.length === 0 && control.instances && control.instances.length > 0) {
      const initialValues = control.instances.map((instance) => ({
        "@id": instance.id || uuid(),
      }));

      initialValues.forEach((item) => {
        append(item);
      });

      setInitialized(true);
    }
  }, [control.instances, fields.length, append, initialized]);

  const canAddMore = !readOnly && (control.max === undefined || control.max > fields.length);
  const canDelete = !readOnly && (control.min === undefined || fields.length > control.min);

  const handleAdd = React.useCallback(() => {
    if (!canAddMore) return;

    const newItem = {
      "@id": uuid(),
    };

    append(newItem);
  }, [canAddMore, append]);

  const handleDelete = React.useCallback(
    (index: number) => {
      if (!canDelete) return;
      remove(index);
    },
    [canDelete, remove],
  );

  if (fields.length === 0 && readOnly) {
    // If there are no fields and readOnly, hide the control
    return null;
  }

  return (
    <div
      className={cn("flex flex-col gap-4", className)}
      data-slot="form-item"
      data-control={control.type}
      data-id={control.id}
      data-name={fieldName}
    >
      {/* Header with label and add button */}
      <div data-slot="entity-header" className="flex items-center justify-between">
        {
          control.label
            ? (<Text variant="h6" asChild>
              <label aria-label={t(control.label)}>{t(control.label)}</label>
            </Text>)
            : null
        }

        {canAddMore && (
          <Button
            data-slot="entity-add"
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleAdd}
            aria-label={t("form.add_item")}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
      {fields.length === 0 ? (
        <div
          data-slot="entity-empty"
          className="text-muted-foreground text-center pt-4 pb-8"
        >
          {/* Empty state */}
          <Text variant="body">{t("form.no_items")}</Text>
        </div>
      ) : (
        <div data-slot="entity-list" className="flex flex-col gap-4">
          {/* Field items */}
          <AttributeNestingProvider value={true}>
            {fields.map((field, index) => {
              const isLastItem = index === fields.length - 1;
              const showDeleteButton = canDelete && fields.length > (control.min ?? 0);

              return (
                <div
                  data-slot="entity-item"
                  key={field.id}
                  className={cn("flex items-start gap-4", !isLastItem && "pb-4 border-b border-border")}
                >
                  {/* Hidden controller for the @id field */}
                  <Controller
                    control={formControl}
                    name={`${fieldName}.${index}.@id`}
                    defaultValue={(field as any)["@id"]}
                    render={() => <></>}
                  />

                  {/* Field content */}
                  <div data-slot="entity-controls" id={field.id} className="flex-1 space-y-4">
                    <FieldControl
                      control={control}
                      index={index}
                      parentPath={parentPath}
                    />
                  </div>

                  {/* Delete button */}
                  {showDeleteButton && (
                    <Button
                      data-slot="entity-remove"
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(index)}
                      className="text-destructive hover:text-destructive"
                      aria-label={t("form.remove_item")}
                      aria-controls={field.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </AttributeNestingProvider>
        </div>
      )}
    </div>
  );
};
