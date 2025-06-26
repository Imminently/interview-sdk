import clsx from "clsx";
import { useEffect, useState } from "react";
import { useRef } from "react";
import { Explanation } from "./Explanation";
import { Error } from "./Error";
import { useInterview } from "../providers/InterviewProvider";



export const _InputControl = (props: any) => {
  const { id, type, attribute, value, setValue, variation, readOnly, rows, inputClassNames, onFocus, onBlur } = props;
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValue && setValue(attribute, e.target.value);
  };

  const handleBlur = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Force the input to show the actual value without triggering onChange
    onBlur && onBlur(e);
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
    name: attribute,
    id,
    type: type || 'text',
    disabled: readOnly,
    placeholder: " ",
    defaultValue: value || '',
    autoComplete: "off",
    onChange: handleChange,
    onBlur: handleBlur,
    onKeyDown: handleKeyDown,
    onFocus: onFocus,
  };

  if (rows) {
    return <textarea rows={rows} {...commonProps} />;
  }
  return <input type="text" {...commonProps} />;
};

export const InputControl = (props: any) => {
  const [labelWidth, setLabelWidth] = useState(0);
  const [hasValue, setHasValue] = useState(false);
  const { values } = useInterview();
  const { id, label, type, labelDisplay, attribute, value, setValue, variation, readOnly, rows, classNames, showExplanation, onBlur} = props;

  useEffect(() => {
    if (values[attribute] || type === 'date' || type === 'time') {
      setHasValue(true);
    }
  }, [values[attribute], type]);
  // For legend width animation
  const labelRef = useRef<HTMLLabelElement>(null);
 
  let inputClassNames;
  if (!labelDisplay || labelDisplay === 'inline') {
    inputClassNames = clsx(`dcsvly-ctrl-${type}-input`, classNames.input);
  } else {
    inputClassNames = clsx(`dcsvly-ctrl-${type}-input-seperate`, classNames.inputSeperate);
  }
  if (!labelDisplay || labelDisplay === 'inline') {

    return (
      <>
        <fieldset className={clsx(`dcsvly-ctrl-${type}-fieldset`, classNames.fieldset)}>
          <_InputControl
            id={id}
            attribute={attribute}
            type={type}
            value={value}
            setValue={setValue}
            variation={variation}
            readOnly={readOnly}
            rows={rows}
            inputClassNames={inputClassNames}
            onFocus={() => {
              setHasValue(true);
            }}
            onBlur={onBlur}
          />
          <label
            ref={labelRef}
            htmlFor={id}
            className={clsx(
              `dcsvly-ctrl-${type}-label`,
              classNames.label,
              hasValue ? classNames.labelWithValue : classNames.labelNoValue
            )}
          >
            {label}
          </label>
          <legend
            className={clsx(
              `dcsvly-ctrl-${type}-legend`,
              classNames.legend
            )}
            style={{
              width: hasValue ? labelWidth + 8 : 0, // 8px for padding
              transition: "width 0.2s"
            }}
          >
            <span>{"\u200B"}</span>
          </legend>
          <Explanation control={{
            showExplanation,
            attribute,
          }} />
          
        </fieldset>
        <Error id={attribute} />
      </>
    );
  } else {
    return (
      <>
        <div className={clsx(`dcsvly-ctrl-${type}-container`, classNames.container)}>
          <label
            className={clsx(`dcsvly-ctrl-${type}-label-seperate`, classNames.labelSeperate)}
          >
            {label}
          </label>
          <_InputControl
            id={id}
            attribute={attribute} 
            type={type}
            value={value}
            setValue={setValue}
            variation={variation}
            readOnly={readOnly}
            rows={rows}
            inputClassNames={inputClassNames}
            onBlur={onBlur}
          />
          <Explanation control={{
            showExplanation,
            attribute,
          }} />
        </div>
        <Error id={attribute} />
      </>
    )
  }

}