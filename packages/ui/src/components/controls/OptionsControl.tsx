// Note `options` is a special type that could be select or radio buttons
// this component is used to determine the type of control to render based on the options provided
import { OptionsControl } from '@imminently/interview-sdk';
import { SelectFormControl } from './SelectControl';
import { RadioFormControl } from './RadioControl';

export const OptionsFormControl = ({ control }: { control: OptionsControl }) => {
  const { options, asRadio } = control;

  if (!options || options.length === 0) {
    return null; // No options to display
  }

  if (asRadio) {
    return <RadioFormControl control={control} />;
  }

  return <SelectFormControl control={control} />;
}