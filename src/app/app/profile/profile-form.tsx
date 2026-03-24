"use client";

import { Check, ChevronDown } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { Button, Field, FieldErrorMessage } from "@/components/site-ui";
import {
  PROFILE_CAMPUS_OPTIONS,
  PROFILE_GENDER_OPTIONS,
  PROFILE_GRADE_OPTIONS,
  getBirthYearRange,
  getDepartmentOptionsForGrade,
  sanitizeDepartmentForGrade,
} from "@/features/app/profile-contract";
import { cn } from "@/lib/utils";

const pickerTriggerClassName =
  "border-border bg-background text-foreground focus:border-primary focus:ring-primary/15 w-full rounded-2xl border px-4 py-3 text-left text-sm transition outline-none focus:ring-2";
const pickerErrorClassName =
  "border-[color:var(--status-warning)] focus:border-[color:var(--status-warning)] focus:ring-[color:var(--status-warning)]/15";
const pickerPanelClassName =
  "bg-card/98 border-border absolute inset-x-0 z-30 mt-2 overflow-hidden rounded-[24px] border p-2 shadow-[0_26px_56px_rgba(31,24,24,0.16)] backdrop-blur";

type ProfileFieldName =
  | "nickname"
  | "gender"
  | "grade"
  | "department"
  | "campus"
  | "birthYear";
type ProfileFormErrors = Partial<Record<ProfileFieldName, string>>;

function includesOption(options: readonly string[], value: string) {
  return options.some((option) => option === value);
}

function validateProfileForm(input: {
  nickname: string;
  gender: string;
  grade: string;
  department: string;
  campus: string;
  birthYear: string;
  minBirthYear: number;
  maxBirthYear: number;
}): ProfileFormErrors {
  const errors: ProfileFormErrors = {};
  const normalizedDepartment = sanitizeDepartmentForGrade(
    input.grade,
    input.department.trim(),
  );
  const departmentOptions = getDepartmentOptionsForGrade(input.grade);
  const birthYear = input.birthYear.trim();

  if (!input.nickname.trim()) {
    errors.nickname = "请填写昵称";
  }

  if (!includesOption(PROFILE_GENDER_OPTIONS, input.gender)) {
    errors.gender = "请选择性别";
  }

  if (!includesOption(PROFILE_GRADE_OPTIONS, input.grade)) {
    errors.grade = "请选择年级";
  }

  if (!includesOption(departmentOptions, normalizedDepartment)) {
    errors.department =
      input.grade === "大一" ? "大一年级固定为新生学院" : "请从列表中选择院系";
  }

  if (!includesOption(PROFILE_CAMPUS_OPTIONS, input.campus)) {
    errors.campus = "请选择所在校区";
  }

  if (!birthYear) {
    errors.birthYear = "请输入出生年份";
    return errors;
  }

  if (!/^\d{4}$/.test(birthYear)) {
    errors.birthYear = "出生年份必须是四位数字";
    return errors;
  }

  const numericBirthYear = Number(birthYear);
  if (
    numericBirthYear < input.minBirthYear ||
    numericBirthYear > input.maxBirthYear
  ) {
    errors.birthYear = `出生年份必须在 ${input.minBirthYear} 到 ${input.maxBirthYear} 之间`;
  }

  return errors;
}

function PickerField({
  label,
  name,
  value,
  placeholder,
  options,
  error,
  onChange,
}: {
  label: string;
  name: "grade" | "campus";
  value: string;
  placeholder: string;
  options: readonly string[];
  error?: string | undefined;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) {
        return;
      }

      setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative block">
      <span className="text-muted-foreground mb-2 block text-xs tracking-[0.08em]">
        {label}
      </span>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          pickerTriggerClassName,
          "flex items-center justify-between gap-3",
          error && pickerErrorClassName,
        )}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={cn(!value && "text-muted-foreground")}>
          {value || placeholder}
        </span>
        <ChevronDown
          className={cn(
            "text-muted-foreground size-4 shrink-0 transition",
            open && "rotate-180 text-foreground",
          )}
        />
      </button>
      {open ? (
        <div className={pickerPanelClassName}>
          <ul role="listbox" className="max-h-64 space-y-1 overflow-y-auto pr-1">
            {options.map((option) => {
              const selected = option === value;

              return (
                <li key={option}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={cn(
                      "flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm transition",
                      selected
                        ? "bg-secondary text-foreground shadow-[inset_0_0_0_1px_rgba(139,74,82,0.12)]"
                        : "text-secondary-foreground hover:bg-muted/80 hover:text-foreground",
                    )}
                    onClick={() => {
                      onChange(option);
                      setOpen(false);
                    }}
                  >
                    <span>{option}</span>
                    <Check
                      className={cn(
                        "size-4 shrink-0",
                        selected ? "text-primary" : "text-transparent",
                      )}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      <FieldErrorMessage message={error} />
    </div>
  );
}

function DepartmentField({
  value,
  options,
  error,
  readOnly,
  onChange,
}: {
  value: string;
  options: readonly string[];
  error?: string | undefined;
  readOnly: boolean;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const isOpen = open && !readOnly;
  const filteredOptions = options.filter((option) => option.includes(value.trim()));

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) {
        return;
      }

      setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  return (
    <div ref={rootRef} className="relative block">
      <span className="text-muted-foreground mb-2 block text-xs tracking-[0.08em]">
        院系
      </span>
      <div className="relative">
        <input
          name="department"
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (!readOnly) {
              setOpen(true);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              return;
            }

            if (event.key === "Enter" && isOpen) {
              event.preventDefault();
              if (filteredOptions[0]) {
                onChange(filteredOptions[0]);
                setOpen(false);
              }
            }
          }}
          readOnly={readOnly}
          autoComplete="off"
          required
          aria-invalid={error ? true : undefined}
          className={cn(
            pickerTriggerClassName,
            "pr-11",
            readOnly && "cursor-default opacity-80",
            error && pickerErrorClassName,
          )}
          placeholder="请输入或搜索院系"
        />
        {!readOnly ? (
          <button
            type="button"
            aria-label={isOpen ? "收起院系列表" : "展开院系列表"}
            className="text-muted-foreground absolute inset-y-0 right-3 flex items-center"
            onClick={() => setOpen((current) => !current)}
          >
            <ChevronDown
              className={cn(
                "size-4 shrink-0 transition",
                isOpen && "rotate-180 text-foreground",
              )}
            />
          </button>
        ) : null}
      </div>
      {isOpen ? (
        <div className={pickerPanelClassName}>
          {filteredOptions.length > 0 ? (
            <ul role="listbox" className="max-h-64 space-y-1 overflow-y-auto pr-1">
              {filteredOptions.map((option) => {
                const selected = option === value;

                return (
                  <li key={option}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={cn(
                        "flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm transition",
                        selected
                          ? "bg-secondary text-foreground shadow-[inset_0_0_0_1px_rgba(139,74,82,0.12)]"
                          : "text-secondary-foreground hover:bg-muted/80 hover:text-foreground",
                      )}
                      onClick={() => {
                        onChange(option);
                        setOpen(false);
                      }}
                    >
                      <span>{option}</span>
                      <Check
                        className={cn(
                          "size-4 shrink-0",
                          selected ? "text-primary" : "text-transparent",
                        )}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="text-muted-foreground rounded-2xl bg-muted/70 px-3 py-3 text-sm">
              没有匹配项，请继续输入完整院系名称。
            </div>
          )}
        </div>
      ) : null}
      {!error ? (
        <span className="text-muted-foreground mt-2 block text-xs leading-6">
          {readOnly
            ? "大一年级固定为新生学院，不可修改。"
            : "支持输入搜索并从预设院系列表中选择。"}
        </span>
      ) : null}
      <FieldErrorMessage message={error} />
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      保存资料
    </Button>
  );
}

export function ProfileForm({
  action,
  defaultValues,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaultValues: {
    nickname: string;
    gender: string;
    grade: string;
    department: string;
    campus: string;
    birthYear: string;
  };
}) {
  const [gender, setGender] = useState(defaultValues.gender);
  const [grade, setGrade] = useState(defaultValues.grade);
  const [department, setDepartment] = useState(() =>
    sanitizeDepartmentForGrade(defaultValues.grade, defaultValues.department),
  );
  const [campus, setCampus] = useState(defaultValues.campus);
  const [errors, setErrors] = useState<ProfileFormErrors>({});
  const isFirstYear = grade === "大一";
  const departmentOptions = getDepartmentOptionsForGrade(grade);
  const { minBirthYear, maxBirthYear } = getBirthYearRange();

  function clearError(name: ProfileFieldName) {
    setErrors((current) => {
      if (!current[name]) {
        return current;
      }

      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const nextErrors = validateProfileForm({
      nickname: String(formData.get("nickname") ?? ""),
      gender: String(formData.get("gender") ?? ""),
      grade: String(formData.get("grade") ?? ""),
      department: String(formData.get("department") ?? ""),
      campus: String(formData.get("campus") ?? ""),
      birthYear: String(formData.get("birthYear") ?? ""),
      minBirthYear,
      maxBirthYear,
    });

    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault();
      setErrors(nextErrors);
      return;
    }

    setErrors({});
  }

  return (
    <form
      action={action}
      className="mt-8 grid gap-6"
      noValidate
      onSubmit={handleSubmit}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Field
          name="nickname"
          label="昵称"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          defaultValue={defaultValues.nickname}
          error={errors.nickname}
          onChange={() => clearError("nickname")}
          required
        />

        <div className="block">
          <span className="text-muted-foreground mb-2 block text-xs tracking-[0.08em]">
            性别
          </span>
          <div className="grid grid-cols-2 gap-3" role="radiogroup">
            {PROFILE_GENDER_OPTIONS.map((option) => (
              <label
                key={option}
                className={cn(
                  "border-border flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition",
                  gender === option &&
                    "border-primary bg-secondary/65 text-foreground shadow-[0_14px_32px_rgba(139,74,82,0.08)]",
                  errors.gender &&
                    "border-[color:var(--status-warning)]/45",
                )}
              >
                <input
                  type="radio"
                  name="gender"
                  value={option}
                  checked={gender === option}
                  onChange={() => {
                    setGender(option);
                    clearError("gender");
                  }}
                  className="accent-[color:var(--primary)]"
                  required
                />
                {option}
              </label>
            ))}
          </div>
          <FieldErrorMessage message={errors.gender} />
        </div>

        <PickerField
          name="grade"
          label="年级"
          value={grade}
          placeholder="请选择年级"
          options={PROFILE_GRADE_OPTIONS}
          error={errors.grade}
          onChange={(nextGrade) => {
            setGrade(nextGrade);
            setDepartment((currentDepartment) =>
              sanitizeDepartmentForGrade(nextGrade, currentDepartment),
            );
            clearError("grade");
            clearError("department");
          }}
        />

        <DepartmentField
          value={department}
          options={departmentOptions}
          error={errors.department}
          readOnly={isFirstYear}
          onChange={(nextDepartment) => {
            setDepartment(nextDepartment);
            clearError("department");
          }}
        />

        <PickerField
          name="campus"
          label="所在校区"
          value={campus}
          placeholder="请选择所在校区"
          options={PROFILE_CAMPUS_OPTIONS}
          error={errors.campus}
          onChange={(nextCampus) => {
            setCampus(nextCampus);
            clearError("campus");
          }}
        />

        <Field
          name="birthYear"
          label="出生年份"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          maxLength={4}
          defaultValue={defaultValues.birthYear}
          min={minBirthYear}
          max={maxBirthYear}
          placeholder={`${minBirthYear}-${maxBirthYear}`}
          error={errors.birthYear}
          onChange={() => clearError("birthYear")}
          required
        />
      </div>
      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
