"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import {
    Controller,
    FormProvider,
    useFormContext,
    type ControllerProps,
    type FieldPath,
    type FieldValues,
} from "react-hook-form";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Form                                                                       */
/* -------------------------------------------------------------------------- */

const Form = FormProvider;

/* -------------------------------------------------------------------------- */
/* Field                                                                      */
/* -------------------------------------------------------------------------- */

type FormFieldContextValue<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
    name: TName;
};

const FormFieldContext =
    React.createContext<FormFieldContextValue>(
        {} as FormFieldContextValue
    );

function FormField<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
      ...props
  }: ControllerProps<TFieldValues, TName>) {
    return (
        <FormFieldContext.Provider
            value={{ name: props.name }}
        >
            <Controller {...props} />
        </FormFieldContext.Provider>
    );
}

/* -------------------------------------------------------------------------- */
/* Item                                                                       */
/* -------------------------------------------------------------------------- */

type FormItemContextValue = {
    id: string;
};

const FormItemContext =
    React.createContext<FormItemContextValue>(
        {} as FormItemContextValue
    );

function FormItem({
                      className,
                      ...props
                  }: React.HTMLAttributes<HTMLDivElement>) {
    const id = React.useId();

    return (
        <FormItemContext.Provider value={{ id }}>
            <div
                className={cn("space-y-2", className)}
                {...props}
            />
        </FormItemContext.Provider>
    );
}

/* -------------------------------------------------------------------------- */
/* Hook                                                                       */
/* -------------------------------------------------------------------------- */

function useFormField() {
    const fieldContext =
        React.useContext(FormFieldContext);

    const itemContext =
        React.useContext(FormItemContext);

    const {
        getFieldState,
        formState,
    } = useFormContext();

    const fieldState = getFieldState(
        fieldContext.name,
        formState
    );

    if (!fieldContext) {
        throw new Error(
            "useFormField must be used inside <FormField>"
        );
    }

    const { id } = itemContext;

    return {
        id,
        name: fieldContext.name,
        formItemId: `${id}-form-item`,
        formDescriptionId: `${id}-form-description`,
        formMessageId: `${id}-form-message`,
        ...fieldState,
    };
}

/* -------------------------------------------------------------------------- */
/* Label                                                                      */
/* -------------------------------------------------------------------------- */

function FormLabel({
                       className,
                       ...props
                   }: React.ComponentPropsWithoutRef<
    typeof LabelPrimitive.Root
>) {
    const {
        error,
        formItemId,
    } = useFormField();

    return (
        <Label
            className={cn(
                error && "text-destructive",
                className
            )}
            htmlFor={formItemId}
            {...props}
        />
    );
}

/* -------------------------------------------------------------------------- */
/* Control                                                                    */
/* -------------------------------------------------------------------------- */

function FormControl({
                         ...props
                     }: React.ComponentPropsWithoutRef<
    typeof Slot
>) {
    const {
        error,
        formItemId,
        formDescriptionId,
        formMessageId,
    } = useFormField();

    return (
        <Slot
            id={formItemId}
            aria-describedby={
                !error
                    ? formDescriptionId
                    : `${formDescriptionId} ${formMessageId}`
            }
            aria-invalid={!!error}
            {...props}
        />
    );
}

/* -------------------------------------------------------------------------- */
/* Description                                                                */
/* -------------------------------------------------------------------------- */

function FormDescription({
                             className,
                             ...props
                         }: React.HTMLAttributes<HTMLParagraphElement>) {
    const { formDescriptionId } =
        useFormField();

    return (
        <p
            id={formDescriptionId}
            className={cn(
                "text-sm text-muted-foreground",
                className
            )}
            {...props}
        />
    );
}

/* -------------------------------------------------------------------------- */
/* Message                                                                    */
/* -------------------------------------------------------------------------- */

function FormMessage({
                         className,
                         children,
                         ...props
                     }: React.HTMLAttributes<HTMLParagraphElement>) {
    const {
        error,
        formMessageId,
    } = useFormField();

    const body = error
        ? String(error.message ?? "")
        : children;

    if (!body) return null;

    return (
        <p
            id={formMessageId}
            className={cn(
                "text-sm font-medium text-destructive",
                className
            )}
            {...props}
        >
            {body}
        </p>
    );
}

export {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormDescription,
    FormMessage,
};