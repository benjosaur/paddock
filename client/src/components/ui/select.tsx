import ReactSelect, {
  Props as SelectProps,
  GroupBase,
  StylesConfig,
} from "react-select";
import { cn } from "../../lib/utils";

export interface CustomSelectProps<
  Option = { label: string; value: string },
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
> extends SelectProps<Option, IsMulti, Group> {
  className?: string;
}

const Select = <
  Option = { label: string; value: string },
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
>({
  className,
  ...props
}: CustomSelectProps<Option, IsMulti, Group>) => {
  const customStyles: StylesConfig<Option, IsMulti, Group> = {
    control: (base) => ({
      ...base,
      borderRadius: "12px", // More rounded (rounded-xl equivalent)
      borderColor: "rgba(209, 213, 219, 0.4)", // Less opaque border (gray-300/40)
      paddingLeft: "2px", // Add 1x axis padding (4px = 0.25rem)
      paddingRight: "2px",
      "&:hover": {
        borderColor: "rgba(209, 213, 219, 0.6)", // Slightly more opaque on hover
      },
    }),
    menu: (base) => ({
      ...base,
      borderRadius: "12px", // Match control border radius
    }),
  };

  return (
    <ReactSelect
      className={cn("react-select-container", className)}
      styles={customStyles}
      {...props}
    />
  );
};

Select.displayName = "Select";

export { Select };
