import clsx from "clsx";
import { RenderControl } from "../RenderControl";
import { RenderableSwitchContainerControl, RepeatingContainerControl, SwitchContainerControl } from "@/core";

const repeatingContainerStyles = {
  table: [
    "grid",
    "mb-0",
    // grid-template-columns is set dynamically via style prop
    "[&>*]:border",
    "[&>*]:border-t-0",
    "[&>*]:border-r-0",
    "[&>*]:mb-0",
    "[&>*]:!mb-0",
    "[&>*]:p-1",
    "[&>*]:break-words",
    "[&>*]:whitespace-pre-wrap",
    "[&>*]:hyphens-auto",
    "[&>*:last-child]:border-r",
    "[&>.header]:font-semibold",
    "[&>.header]:border",
    "[&>.header]:border-t",
    "[&>.header]:border-r-0",
    "[&>.header.last]:border-r",
  ].join(" "),
  header: [
    "font-semibold",
    "border",
    "border-t",
    "border-r-0",
    "[&.last]:border-r",
  ].join(" "),
  borderless: [
    "[&>*]:border-0",
    "[&>*:last-child]:border-r-0",
    "[&>.header]:border-0",
    "[&>.header.last]:border-0",
  ].join(" "),
  top_border: "[&>*]:border-t",
  last_row: "mb-4",
};

export const RepeatingContainer = (props: { control: RepeatingContainerControl, className?: string }) => {
  const { control, className } = props;
  const { controls } = control;
  const isTable = control?.display === "table";
  // if `isTable`; each container is one row - so the number of elements in control.controls is the number of columns
  const countCols = isTable ? controls?.length : null;
  const isFirstRow = control?.isFirst ?? false;
  const isLastRow = (control as any)?.isLast ?? false;
  const showHeaders = control?.showHeaders ?? true;
  const showBorders = control?.showBorders ?? true;

  const colHeaders = (() => {
    if (!isTable) {
      return null;
    }

    return controls?.map((ctrl: any) => ctrl.columnHeading || "");
  })();

  const colWidths = (() => {
    if (!isTable) {
      return null;
    }

    return controls?.map((ctrl: any) => ctrl.columnWidth || "");
  })();

  const colLayout = (() => {
    if (!isTable) {
      return {};
    }

    const widthsDefined = colWidths?.some((width) => !!(width || "")) ?? false;

    if (widthsDefined) {
      const widths = colWidths?.map((width) => (width ? `${width}px` : "1fr"));
      return {
        gridTemplateColumns: widths?.join(" "),
      };
    }

    return {
      gridTemplateColumns: `repeat(${countCols}, 1fr)`,
    };
  })();

  // console.log("====> repeating_container control", control);

  // -- rendering

  const renderHeaderRow = () => {
    if (
      !isFirstRow ||
      !isTable ||
      !colHeaders ||
      colHeaders.length === 0 ||
      colHeaders.length !== countCols ||
      !showHeaders
    ) {
      return null;
    }

    return colHeaders.map((header, index) => {
      return (
        <div
          key={index}
          className={clsx("header", { last: index === colHeaders.length - 1 })}
        >
          {header}
        </div>
      );
    });
  };

  const filteredControls = controls?.filter((c) => {
    if ('children' in c && (c.children as any[]).length === 0) {
      return false; // Skip controls with no children
    }
    // TODO this is super hacky, need to find a better way to filter out empty switch containers
    if (c.type === "switch_container") {
      c.outcome_true?.length > 0 || c.outcome_false?.length > 0
      const switchc = c as RenderableSwitchContainerControl;
      const ctrls = (switchc.branch === "true" ? switchc.outcome_true : switchc.outcome_false) ?? [];
      return ctrls.length > 0; // Only include switch containers with outcomes
    }
    return true; // Include all other controlsc.outcome_true?.length > 0 || c.outcome_false?.length > 0
  }) || [];

  if (filteredControls.length === 0) return null;

  // console.log("repeating_container controls", control, filteredControls);

  // NOTE repeat containers do not have unique ids, so we cannot use `key={control.id}` here
  // we are using the control.attribute as the unique key, as repeated instances will have the same control ids

  return (
    <div
      className={clsx(
        "flex flex-col gap-2",
        className,
        isTable && repeatingContainerStyles.table,
        isTable && !showBorders && repeatingContainerStyles.borderless,
        isTable && showBorders && !showHeaders && isFirstRow && repeatingContainerStyles.top_border,
        isLastRow && repeatingContainerStyles.last_row,
      )}
      style={colLayout}
      data-type={control.type}
      data-loading={(control as any).loading ? "true" : undefined}
    >
      {renderHeaderRow()}
      {filteredControls?.map((value) => <RenderControl key={value.id} control={value} />)}
    </div>
  );
};