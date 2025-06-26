import React, { useState } from "react";
import { useInterview } from "../providers/InterviewProvider";
import { getIcon, themeMerge, useTheme } from "../providers/ThemeProvider";
import clsx from "clsx";
import z, { ZodTypeAny } from "zod";
import { t } from "../utils/translateFn";
import { useFieldRegistration } from "../providers/InterviewProvider";
import { Error } from "./Error";
import { Explanation } from "./Explanation";

export const BooleanControl = (props: any) => {
  const { control, classNames, checkedIcon, indeterminateIcon } = props;
  const mergedClassNames = themeMerge('BooleanControl', classNames);
  const { values, setValue} = useInterview();
  const { icons } = useTheme();

  useFieldRegistration({
    name: control?.attribute,
    defaultValue: control?.default,
    validate:  (): ZodTypeAny => {
      let schema: ZodTypeAny;
      schema = z.boolean();
      if (control?.required) {
        schema = schema.refine((val) => val !== undefined, {
          message: t("validations.required")
        });
      }
      return schema;
    },
    visible: !control?.hidden
  })

  if (!control) return null;
  const { id, label, labelDisplay, required, attribute, hidden, show, showExplanation, readOnly, longDescription } = control;

  // Support true, false, and indeterminate (null/undefined)
  const value = values?.[attribute] ?? null;
  const isChecked = value === true;
  const isIndeterminate = value === null || value === undefined;

  // Ripple animation state
  const [ripple, setRipple] = useState(false);
  if (hidden) return null;
  const handleClick = () => {
    if (readOnly) return;
    setRipple(true);
    setTimeout(() => setRipple(false), 300);
    // Toggle: null/undefined -> true, true -> false, false -> true
    setValue && setValue(attribute, isIndeterminate ? true : !isChecked);
  };
  // Checkbox visual
  const checkbox = (
    <button
      id={id}
      type="button"
      aria-checked={isChecked}
      aria-label={label}
      disabled={readOnly}
      tabIndex={0}
      className={clsx(
        'dcsvly-boolean-control-checkbox',
        mergedClassNames.checkbox,
        isChecked ? mergedClassNames.checkboxChecked : mergedClassNames.checkboxUnchecked,
        isIndeterminate && mergedClassNames.checkboxIndeterminate,
        readOnly && mergedClassNames.checkboxDisabled
      )}
      onClick={handleClick}
      onKeyDown={e => {
        if (e.key === " " || e.key === "Enter") handleClick();
      }}
    >
      {/* Ripple */}
      {ripple && (
        <span className={mergedClassNames.ripple} />
      )}
      {/* Checkmark or indeterminate */}
      {isChecked && getIcon('checked', checkedIcon)}
      {isIndeterminate && getIcon('indeterminateCheck', indeterminateIcon)}
    </button>
  );

  // Layout
  if (!labelDisplay || labelDisplay === "inline") {
    return (
      <div>
        <div className={clsx('dcsvly-boolean-control-root', mergedClassNames.root)}>
          {checkbox}
          <span className={clsx('dcsvly-boolean-control-label', mergedClassNames.label)}>{label}</span>
          <Explanation control={control} />
        </div>
        { longDescription && <div className={mergedClassNames.longDescription}>{longDescription}</div>}
        <Error id={attribute} />
      </div>
    );
  } else {
    return (
      <div className={clsx('dcsvly-boolean-control-root-seperate', mergedClassNames.rootSeperate)}>
        <div className={clsx('dcsvly-boolean-control-label-seperate', mergedClassNames.labelSeperate)}>{label}</div>
        <div>{checkbox}</div>
        <Explanation control={control} />
        { longDescription && <div className={clsx('dcsvly-boolean-control-long-description', mergedClassNames.longDescription)}>{longDescription}</div>}
        <Error id={attribute} />
      </div>
    );
  }
};