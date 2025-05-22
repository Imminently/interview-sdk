import React, { useRef, useEffect, useState } from "react";
import clsx from "clsx";
import { themeMerge, useTheme } from "../providers/ThemeProvider";
import { useFieldRegistration, useInterview } from "../providers/InterviewProvider";
import { Error } from "../controls/Error";
import { isNumber } from "lodash-es";
import { z, ZodTypeAny } from "zod";
import { t } from "../utils/translateFn";
const TextInputControl = (props: any) => {
  const { id, value, setValue, variation, readOnly, rows, inputClassNames } = props;
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  
      setValue && setValue(id, e.target.value);
    
  };

  const handleKeyDown = variation === 'number'
    ? (e: React.KeyboardEvent) => {
        if (
          !/[0-9.-]/.test(e.key) &&
          !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key)
        ) {
          e.preventDefault();
        }
      }
    : undefined;

  const commonProps = {
    className: inputClassNames,
    name: id,
    id,
    disabled: readOnly,
    placeholder: " ",
    defaultValue: value || '',
    autoComplete: "off",
    onChange: handleChange,
    onKeyDown: handleKeyDown,
  };

  if (rows) {
    return <textarea rows={rows} {...commonProps} />;
  }
  return <input type={variation === 'number' ? 'text' : 'text'} {...commonProps} />;
};

export const TextControl = (props: any) => {
  const { control, classNames } = props;
  const { icons } = useTheme();
  const mergedClassNames = themeMerge('TextControl', classNames);
  const { values, setValue } = useInterview();
  const [labelWidth, setLabelWidth] = useState(0);
  const [showExplanationPopup, setShowExplanationPopup] = useState(false);
 // For legend width animation
 const labelRef = useRef<HTMLLabelElement>(null);

 useEffect(() => {
  if (labelRef.current) {
    setLabelWidth(labelRef.current.offsetWidth);
  }
}, [control?.label]);

  useFieldRegistration({
    name: control?.id,
    defaultValue: control?.default,
    validate:  (): ZodTypeAny => {
      let schema: ZodTypeAny;
    
      // 1. Base type
      if (control.variation === "number") {
        schema = z.number();
      } else if (control.variation === "email") {
        schema = z.string().email(t("validations.email"));
      } else {
        schema = z.string();
      }
    
      
    
      // 3. Max length/Max value
      if (typeof control.max === "number") {
        if (control.variation === "number") {
          console.log('shcena', schema);
          schema = (schema as z.ZodNumber).max(control.max, t("validations.max", { max: control.max }));
        } else {
          schema = (schema as z.ZodString).max(control.max, t("validations.max", { max: control.max }));
        }
      }

    
      // 4. Min value (for numbers)
      if (typeof control.min === "number" && control.variation === "number") {
        schema = (schema as z.ZodNumber).min(control.min, t("validations.min", { min: control.min }));
      }
      // 2. Required/Optional
      if (control.required) {
        if (control.variation === "number") {
          // For numbers, required is the default (z.number() is required by default)
          // No need to do anything
        } else {
          schema = (schema as z.ZodString).nonempty(t("validations.required"));
        }
      } else {
        schema = schema.optional();
      }
      if (control.variation === "number") {
        schema = z.preprocess(
          (val) => (val === "" ? undefined : Number(val)),
          schema
        );
      }
    
      return schema;
    },
    visible: !control?.hidden
  });
  if (!control) return null;
  const { id, labelDisplay, readOnly, rows, hidden, showExplanation, variation } = control;
  if (hidden) return null;
  let value = (values && values[id]) || control.value;
  let hasValue = typeof value !== 'undefined' && value !== null && value !== '';

 
  let inputClassNames;
  if (!labelDisplay || labelDisplay === 'inline') {
    inputClassNames = clsx('dcsvly-ctrl-text-input', mergedClassNames.input);
  } else {
    inputClassNames = clsx('dcsvly-ctrl-text-input-seperate', mergedClassNames.inputSeperate);
  }
  if (!labelDisplay || labelDisplay === 'inline') {
    let labelNoValueClass = rows
      ? mergedClassNames.labelTextareaNoValue
      : mergedClassNames.labelNoValue;
    return (
      <>
        <fieldset className={clsx('dcsvly-ctrl-text-fieldset', mergedClassNames.fieldset)}>
          <TextInputControl
            id={id}
            value={value}
            setValue={setValue}
            variation={variation}
            readOnly={readOnly}
            rows={rows}
            inputClassNames={inputClassNames}
          />
          <label
            ref={labelRef}
            htmlFor={id}
            className={clsx(
              'dcsvly-ctrl-text-label',
              mergedClassNames.label,
              hasValue ? mergedClassNames.labelWithValue : labelNoValueClass
            )}
          >
            {control.label}
          </label>
          <legend
            className={clsx(
              'dcsvly-ctrl-text-legend',
              mergedClassNames.legend
            )}
            style={{
              width: hasValue ? labelWidth + 8 : 0, // 8px for padding
              transition: "width 0.2s"
            }}
          >
            <span>{"\u200B"}</span>
          </legend>
          {showExplanation && (
            <div className={clsx('dcsvly-help', mergedClassNames.help)}>
              <button
                type="button"
                className={clsx('dcsvly-help-icon', mergedClassNames.helpIcon)}
                onClick={() => setShowExplanationPopup(v => !v)}
                tabIndex={0}
              >
                {icons.help()}
              </button>
              {showExplanationPopup && (
                <div className={clsx('dcsvly-help-popup', mergedClassNames.helpPopup)}>
                  {control.explanation}
                </div>
              )}
            </div>
          )}
        </fieldset>
        <Error id={id} />
      </>
    );
  } else {
    return (
      <>
        <div className={clsx('dcsvly-ctrl-text-container', mergedClassNames.container)}>
          <label
            className={clsx('dcsvly-ctrl-text-label-seperate', mergedClassNames.labelSeperate)}
          >
            {control.label}
          </label>
          <TextInputControl
            id={id}
            value={value}
            setValue={setValue}
            variation={variation}
            readOnly={readOnly}
            rows={rows}
            inputClassNames={inputClassNames}
          />
        </div>
        <Error id={id} />
      </>
    )
  }
};