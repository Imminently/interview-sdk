import React, { useRef, useEffect, useState } from "react";
import clsx from "clsx";
import { themeMerge } from "../providers/ThemeProvider";
import { useFieldRegistration, useInterview } from "../providers/InterviewProvider";
import { Error } from "../controls/Error";
import { z, ZodTypeAny } from "zod";
import { t } from "../utils/translateFn";
import { Explanation } from "./Explanation";

const TextInputControl = (props: any) => {
  const { id, value, attribute, setValue, readOnly, rows, inputClassNames, symbol, symbolClass } = props;
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValue && setValue(attribute, e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
        if (
          !/[0-9.-]/.test(e.key) &&
          !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key)
        ) {
          e.preventDefault();
        }
      }

  const commonProps = {
    name: attribute,
    id,
    disabled: readOnly,
    placeholder: " ",
    defaultValue: value || '',
    autoComplete: "off",
    onChange: handleChange,
    onKeyDown: handleKeyDown,
  };

  return (
    <div className="relative">
      <span className={symbolClass}>{symbol}</span>
      <input
        type="text"
        className={clsx(inputClassNames, "peer")}
        {...commonProps}
      />
    </div>
  );
};  

export const CurrencyControl = (props: any) => {
  const { control, classNames } = props;
  const mergedClassNames = themeMerge('CurrencyControl', classNames);
  const { values, setValue } = useInterview();
 // For legend width animation


  useFieldRegistration({
    name: control?.attribute,
    defaultValue: control?.default,
    validate:  (): ZodTypeAny => {
      let schema: ZodTypeAny;
      // 1. Base type
      schema = z.number();
      
      // 2. Max length/Max value
      if (typeof control.max === "number") {
        schema = (schema as z.ZodNumber).max(control.max, t("validations.max", { max: control.max }));
      }

    
      // 3. Min value (for numbers)
      if (typeof control.min === "number") {
        schema = (schema as z.ZodNumber).min(control.min, t("validations.min", { min: control.min }));
      }
      // 4. Required/Optional
      if (control.required) {
        // For numbers, required is the default (z.number() is required by default)
        // No need to do anything
      } else {
        schema = schema.optional();
      }
      schema = z.preprocess(
        (val) => (val === "" ? undefined : Number(val)),
        schema
      );
    
      return schema;
    },
    visible: !control?.hidden
  });
  if (!control) return null;
  const { id, attribute, labelDisplay, readOnly, hidden, symbol } = control;
  if (hidden) return null;
  let value = (values && values[attribute]) || control.value;

  let inputClassNames;
  if (!labelDisplay || labelDisplay === 'inline') {
    inputClassNames = clsx('dcsvly-ctrl-currency-input', mergedClassNames.input);
  } else {
    inputClassNames = clsx('dcsvly-ctrl-currency-input-seperate', mergedClassNames.inputSeperate);
  }
  if (!labelDisplay || labelDisplay === 'inline') {
    return (
      <>
        <fieldset className={clsx('dcsvly-ctrl-currency-fieldset', mergedClassNames.fieldset)}>
          <TextInputControl
            id={id}
            attribute={attribute}
            value={value}
            setValue={setValue}
            readOnly={readOnly}
            inputClassNames={inputClassNames}
            symbol={symbol || '$'}
            symbolClass={mergedClassNames.symbol}
          />
         
          <legend
            className={clsx(
              'dcsvly-ctrl-currency-legend',
              mergedClassNames.legend
            )}
            
          >
            <span>{control.label}</span>
          </legend>
          <Explanation control={control} />
          
        </fieldset>
        <Error id={attribute} />
      </>
    );
  } else {
    return (
      <>
        <div className={clsx('dcsvly-ctrl-currency-container', mergedClassNames.container)}>
          <label
            className={clsx('dcsvly-ctrl-currency-label-seperate', mergedClassNames.labelSeperate)}
          >
            {control.label}
          </label>
          <TextInputControl
            id={id}
            attribute={attribute}
            value={value}
            setValue={setValue}
            readOnly={readOnly}
            inputClassNames={inputClassNames}
            symbol={symbol || '$'}
            symbolClass={mergedClassNames.symbol}
          />
          <Explanation control={control} />
        </div>
        <Error id={attribute} />
      </>
    )
  }
};