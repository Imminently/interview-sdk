import { get, isEmpty } from 'lodash-es';
import React, { createContext, useContext, useEffect, useState } from 'react';
const InterviewContext = createContext<any | undefined>(undefined);

interface InterviewProviderProps {
  interview: any;
  children: React.ReactNode;
}

export const InterviewProvider = ({ interview, children }: InterviewProviderProps) => {
  
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, any>>({});
  const [fields, setFields] = useState<Record<string, any>>({});
  const setValue = (id: string, value: any) => {
    if (fields[id]) {
      const validateFn = fields[id].validate;
      const zodSchema = typeof validateFn === 'function' ? validateFn() : validateFn;
      const result = zodSchema.safeParse(value);
      if (!result.success) {
        setErrors(prevErrors => ({ ...prevErrors, [id]: result.error.errors[0].message }));
        return;
      } else {
        setErrors(prevErrors => {
          const newErrors = { ...prevErrors };
          delete newErrors[id];
          return newErrors;
        });
        setValues(prevValues => ({ ...prevValues, [id]: value }));
      }
    }
  }

  const hasErrors = (id: string) => {
    if (!id) return !isEmpty(errors);
    return errors[id] && errors[id].length > 0;
  }
  const getError = (id: string) => {
    return errors[id];
  }

  const registerField = (field: any) => {
    if (field.defaultValue) {
      setValue(field.name, field.defaultValue);
    }
    setFields(prevFields => ({ ...prevFields, [field.name]: field }));
  }
  const unregisterField = (name: string) => {
    setFields(prevFields => {
      const newFields = { ...prevFields };
      delete newFields[name];
      return newFields;
    });
  }
  console.log('fields at provider', fields);
  return (
    <InterviewContext.Provider value={{ 
      interview, 
      values, 
      setValues, 
      errors, 
      setErrors,
      setValue,
      hasErrors,
      getError,
      registerField,
      unregisterField,
      fields
    }}>
      {children}
    </InterviewContext.Provider>
  );
}

export function useInterview() {
  return useContext(InterviewContext) || {};
}

export const getInterviewComponent = (path: string) => {
  let {interview} = useInterview();
  return get(interview, path);
}

export const useFieldRegistration = (props: any) => {
  const { name, validate, defaultValue, visible = true } = props;
  const { registerField, unregisterField } = useInterview();
  useEffect(() => {
    if (!visible || !registerField) return;
    registerField({ name, validate, defaultValue});
    return () => {
      unregisterField(name);
    }
  }, [visible]);
}