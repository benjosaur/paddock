import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Lock, Plus } from "lucide-react";
import { OptionList } from "shared";
import { protectedLocalityValues, protectedServiceValues } from "shared/const";
import { trpc } from "../utils/trpc";
import { useConfig } from "../hooks/useConfig";
import {
  tableRegistry,
  ConfigurableTableId,
} from "../utils/tableRegistry";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

interface OptionListEditorProps {
  title: string;
  // Stable key used in copilot target ids (option-input.<key> etc.).
  copilotKey: string;
  addPlaceholder: string;
  list: OptionList;
  protectedValues: readonly string[];
  onSave: (draft: OptionList) => Promise<unknown>;
  isSaving: boolean;
}

const optionSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function OptionListEditor({
  title,
  copilotKey,
  addPlaceholder,
  list,
  protectedValues,
  onSave,
  isSaving,
}: OptionListEditorProps) {
  const [draft, setDraft] = useState<OptionList | null>(null);
  const [newValue, setNewValue] = useState("");
  const options = (draft ?? list).options;

  const toggleActive = (value: string) => {
    setDraft({
      options: options.map((option) =>
        option.value === value ? { ...option, active: !option.active } : option
      ),
    });
  };

  const addOption = () => {
    const value = newValue.trim();
    if (!value) return;
    if (
      options.some((option) => option.value.toLowerCase() === value.toLowerCase())
    ) {
      toast.error(`"${value}" already exists`);
      return;
    }
    setDraft({ options: [...options, { value, active: true }] });
    setNewValue("");
  };

  const save = async () => {
    if (!draft) return;
    try {
      await onSave(draft);
      setDraft(null);
    } catch {
      // Error toast is shown globally; keep the draft so it can be corrected.
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200/60 shadow-sm p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      <ul className="divide-y divide-gray-100">
        {options.map((option) => (
          <li
            key={option.value}
            className="flex items-center justify-between py-2"
          >
            <span
              className={
                option.active ? "text-gray-800" : "text-gray-400 line-through"
              }
            >
              {option.value}
            </span>
            {protectedValues.includes(option.value) ? (
              <span className="flex items-center space-x-1 text-xs text-gray-400 select-none">
                <Lock className="w-3 h-3" />
                <span>Protected</span>
              </span>
            ) : (
              <Button
                variant="outline"
                size="sm"
                data-copilot-id={`option-toggle.${copilotKey}.${optionSlug(option.value)}`}
                onClick={() => toggleActive(option.value)}
              >
                {option.active ? "Archive" : "Restore"}
              </Button>
            )}
          </li>
        ))}
      </ul>
      <div className="flex items-center space-x-2">
        <Input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addOption();
            }
          }}
          data-copilot-id={`option-input.${copilotKey}`}
          placeholder={addPlaceholder}
        />
        <Button
          variant="outline"
          data-copilot-id={`option-add.${copilotKey}`}
          onClick={addOption}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>
      <Button onClick={save} disabled={draft === null || isSaving}>
        {isSaving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}

interface TableColumnsEditorProps {
  visibleColumns: Record<string, string[]>;
  onSave: (draft: Record<string, string[]>) => Promise<unknown>;
  isSaving: boolean;
}

function TableColumnsEditor({
  visibleColumns,
  onSave,
  isSaving,
}: TableColumnsEditorProps) {
  const [draft, setDraft] = useState<Record<string, string[]> | null>(null);
  const current = draft ?? visibleColumns;

  const visibleFor = (tableId: ConfigurableTableId) =>
    current[tableId] ??
    tableRegistry[tableId].columns
      .filter((col) => !col.defaultHidden)
      .map((col) => col.key);

  const toggleColumn = (tableId: ConfigurableTableId, key: string) => {
    const visible = visibleFor(tableId);
    // Keep the registry's column order regardless of toggle order.
    const nextVisible = tableRegistry[tableId].columns
      .map((col) => col.key)
      .filter((colKey) =>
        colKey === key ? !visible.includes(colKey) : visible.includes(colKey)
      );
    setDraft({ ...current, [tableId]: nextVisible });
  };

  const save = async () => {
    if (!draft) return;
    try {
      await onSave(draft);
      setDraft(null);
    } catch {
      // Error toast is shown globally; keep the draft so it can be corrected.
    }
  };

  const tableIds = Object.keys(tableRegistry) as ConfigurableTableId[];

  return (
    <div className="bg-white rounded-lg border border-gray-200/60 shadow-sm p-6 space-y-6">
      {tableIds.map((tableId) => {
        const visible = visibleFor(tableId);
        return (
          <div key={tableId}>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              {tableRegistry[tableId].label}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {tableRegistry[tableId].columns.map((col) => {
                const isVisible = visible.includes(col.key);
                const isLastVisible = isVisible && visible.length === 1;
                return (
                  <label
                    key={col.key}
                    className={`flex items-center space-x-2 text-sm ${
                      isLastVisible ? "text-gray-400" : "text-gray-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                      checked={isVisible}
                      disabled={isLastVisible}
                      onChange={() => toggleColumn(tableId, col.key)}
                    />
                    <span>{col.header}</span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
      <Button onClick={save} disabled={draft === null || isSaving}>
        {isSaving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}

export function SettingsPage() {
  const config = useConfig();
  const queryClient = useQueryClient();
  const invalidateConfig = () =>
    queryClient.invalidateQueries({ queryKey: trpc.config.get.queryKey() });

  const updateServicesMutation = useMutation(
    trpc.config.updateServices.mutationOptions({ onSuccess: invalidateConfig })
  );
  const updateLocalitiesMutation = useMutation(
    trpc.config.updateLocalities.mutationOptions({
      onSuccess: invalidateConfig,
    })
  );
  const updateTableColumnsMutation = useMutation(
    trpc.config.updateTableColumns.mutationOptions({
      onSuccess: invalidateConfig,
    })
  );

  return (
    <div className="space-y-6 animate-in">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
        Settings
      </h1>
      <Tabs defaultValue="options" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="options" data-copilot-id="tab.options">
            Dropdown Options
          </TabsTrigger>
          <TabsTrigger value="columns" data-copilot-id="tab.columns">
            Table Columns
          </TabsTrigger>
        </TabsList>
        <TabsContent value="options" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <OptionListEditor
              title="Services"
              copilotKey="services"
              addPlaceholder="Add service..."
              list={config.services}
              protectedValues={protectedServiceValues}
              onSave={(draft) => updateServicesMutation.mutateAsync(draft)}
              isSaving={updateServicesMutation.isPending}
            />
            <OptionListEditor
              title="Localities"
              copilotKey="localities"
              addPlaceholder="Add locality..."
              list={config.localities}
              protectedValues={protectedLocalityValues}
              onSave={(draft) => updateLocalitiesMutation.mutateAsync(draft)}
              isSaving={updateLocalitiesMutation.isPending}
            />
          </div>
        </TabsContent>
        <TabsContent value="columns" className="mt-6">
          <TableColumnsEditor
            visibleColumns={config.tableColumns.visibleColumns}
            onSave={(draft) =>
              updateTableColumnsMutation.mutateAsync({ visibleColumns: draft })
            }
            isSaving={updateTableColumnsMutation.isPending}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
