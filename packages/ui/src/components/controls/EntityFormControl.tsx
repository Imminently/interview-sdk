import { type Control, RenderableEntityControl, uuid } from "@imminently/interview-sdk";
import { Plus, Trash2 } from "lucide-react";
import React, { useEffect } from "react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "../ui/button";
import { Text } from "../ui/text";
import { cn } from "@/util";
import { useAttributeToFieldName } from "../../util/attribute-to-field-name";
import { RenderControl } from "../RenderControl";
import { AttributeNestingProvider, useTheme } from "@/providers";

export interface EntityFormControlProps {
  control: RenderableEntityControl;
  className?: string;
}

export const EntityFormControl = ({
  control,
  className
}: EntityFormControlProps) => {
  const { t } = useTheme();
  const { control: formControl } = useFormContext();

  const parentPath = useAttributeToFieldName(control.attribute);
  const fieldName = parentPath ?? control.entity;

  const {
    fields,
    append,
    remove
  } = useFieldArray({
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

  const canAddMore = control.max === undefined || control.max > fields.length;
  const canDelete = control.min === undefined || fields.length > control.min;

  const handleAdd = React.useCallback(() => {
    if (!canAddMore) return;

    const newItem = {
      "@id": uuid(),
    };

    append(newItem);
  }, [canAddMore, append]);

  const handleDelete = React.useCallback((index: number) => {
    if (!canDelete) return;
    remove(index);
  }, [canDelete, remove]);

  const renderFieldControls = React.useCallback((fieldIndex: number) => {
    // First check if we have instances with controls for this specific field
    const instanceControls = control.instances?.[fieldIndex]?.controls;
    if (instanceControls && instanceControls.length > 0) {
      return instanceControls.map((subControl: any, controlIndex: number) => {
        if (subControl.type === "typography") {
          return <RenderControl key={controlIndex} control={subControl} />;
        }

        if ("attribute" in subControl || subControl.type === "entity") {
          const key = (subControl.attribute || subControl.entity)?.split("/").pop();
          if (!key) return null;

          const path = parentPath
            ? `${parentPath}.${fieldIndex}.${key}`
            : `${control.entity}.${fieldIndex}.${key}`;

          const childControl = {
            ...subControl,
            attribute: path,
          } as Control;

          const content = <RenderControl key={controlIndex} control={childControl} />;

          if (subControl.type === "entity") {
            return (
              <div key={controlIndex} className="p-4 border border-border rounded-md">
                {content}
              </div>
            );
          }

          return content;
        }

        console.warn("Unsupported instance control", subControl);
        return null;
      });
    }

    // Fallback to template controls if no instance-specific controls
    if (!control.template || control.template.length === 0) return null;

    return control.template.map((subControl: any, controlIndex: number) => {
      if (subControl.type === "typography") {
        return <RenderControl key={controlIndex} control={subControl} />;
      }

      if ("attribute" in subControl || subControl.type === "entity") {
        const key = (subControl.attribute || subControl.entity)?.split("/").pop();
        if (!key) return null;

        const path = parentPath
          ? `${parentPath}.${fieldIndex}.${key}`
          : `${control.entity}.${fieldIndex}.${key}`;

        const childControl = {
          ...subControl,
          attribute: path,
        } as Control;

        const content = <RenderControl key={controlIndex} control={childControl} />;

        if (subControl.type === "entity") {
          return (
            <div key={controlIndex} className="p-4 border border-border rounded-md">
              {content}
            </div>
          );
        }

        return content;
      }

      console.warn("Unsupported template control", subControl);
      return null;
    });
  }, [control.template, control.instances, control.entity, parentPath]);

  return (
    <div
      className={cn("flex flex-col gap-4", className)}
      data-control={control.type}
      data-id={control.id}
      data-name={fieldName}
    >
      {/* Header with label and add button */}
      <div className="flex items-center justify-between">
        {control.label && (
          <Text variant="h6">
            {t(control.label)}
          </Text>
        )}

        {canAddMore && (
          <Button
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
        <div data-slot="empty" className="text-muted-foreground text-center pt-4 pb-8">
          {/* Empty state */}
          <Text variant="body">{t('form.no_items')}</Text>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Field items */}
          <AttributeNestingProvider value={true}>
            {fields.map((field, index) => {
              const isLastItem = index === fields.length - 1;
              const showDeleteButton = canDelete && fields.length > (control.min ?? 0);

              return (
                <div
                  key={field.id}
                  className={cn(
                    "flex items-start gap-4",
                    !isLastItem && "pb-4 border-b border-border"
                  )}
                >
                  {/* Hidden controller for the @id field */}
                  <Controller
                    control={formControl}
                    name={`${fieldName}.${index}.@id`}
                    defaultValue={(field as any)["@id"]}
                    render={() => <></>}
                  />

                  {/* Field content */}
                  <div className="flex-1 space-y-4">
                    {renderFieldControls(index)}
                  </div>

                  {/* Delete button */}
                  {showDeleteButton && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(index)}
                      className="text-destructive hover:text-destructive"
                      aria-label={t("form.remove_item")}
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
