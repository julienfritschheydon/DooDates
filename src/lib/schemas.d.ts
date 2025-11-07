import { z } from "zod";
export declare const PollCreateSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    selectedDates: z.ZodArray<z.ZodString, "many">;
    timeSlots: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodObject<{
        hour: z.ZodNumber;
        minute: z.ZodNumber;
        duration: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        duration?: number;
        hour?: number;
        minute?: number;
    }, {
        duration?: number;
        hour?: number;
        minute?: number;
    }>, "many">>>;
    participantEmails: z.ZodArray<z.ZodString, "many">;
    settings: z.ZodOptional<z.ZodObject<{
        timeGranularity: z.ZodDefault<z.ZodNumber>;
        allowAnonymousVotes: z.ZodDefault<z.ZodBoolean>;
        allowMaybeVotes: z.ZodDefault<z.ZodBoolean>;
        sendNotifications: z.ZodDefault<z.ZodBoolean>;
        expiresAt: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        timeGranularity?: number;
        allowAnonymousVotes?: boolean;
        allowMaybeVotes?: boolean;
        sendNotifications?: boolean;
        expiresAt?: string;
    }, {
        timeGranularity?: number;
        allowAnonymousVotes?: boolean;
        allowMaybeVotes?: boolean;
        sendNotifications?: boolean;
        expiresAt?: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    title?: string;
    description?: string;
    selectedDates?: string[];
    timeSlots?: Record<string, {
        duration?: number;
        hour?: number;
        minute?: number;
    }[]>;
    participantEmails?: string[];
    settings?: {
        timeGranularity?: number;
        allowAnonymousVotes?: boolean;
        allowMaybeVotes?: boolean;
        sendNotifications?: boolean;
        expiresAt?: string;
    };
}, {
    title?: string;
    description?: string;
    selectedDates?: string[];
    timeSlots?: Record<string, {
        duration?: number;
        hour?: number;
        minute?: number;
    }[]>;
    participantEmails?: string[];
    settings?: {
        timeGranularity?: number;
        allowAnonymousVotes?: boolean;
        allowMaybeVotes?: boolean;
        sendNotifications?: boolean;
        expiresAt?: string;
    };
}>;
export declare const VoteCreateSchema: z.ZodObject<{
    voterName: z.ZodString;
    voterEmail: z.ZodString;
    selections: z.ZodRecord<z.ZodString, z.ZodObject<{
        vote: z.ZodEnum<["yes", "no", "maybe"]>;
        timeSlots: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodEnum<["yes", "no", "maybe"]>>>;
    }, "strip", z.ZodTypeAny, {
        timeSlots?: Record<string, "yes" | "no" | "maybe">;
        vote?: "yes" | "no" | "maybe";
    }, {
        timeSlots?: Record<string, "yes" | "no" | "maybe">;
        vote?: "yes" | "no" | "maybe";
    }>>;
    comment: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    voterName?: string;
    voterEmail?: string;
    selections?: Record<string, {
        timeSlots?: Record<string, "yes" | "no" | "maybe">;
        vote?: "yes" | "no" | "maybe";
    }>;
    comment?: string;
}, {
    voterName?: string;
    voterEmail?: string;
    selections?: Record<string, {
        timeSlots?: Record<string, "yes" | "no" | "maybe">;
        vote?: "yes" | "no" | "maybe";
    }>;
    comment?: string;
}>;
export declare const ProfileUpdateSchema: z.ZodObject<{
    fullName: z.ZodOptional<z.ZodString>;
    timezone: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    preferences: z.ZodOptional<z.ZodObject<{
        language: z.ZodDefault<z.ZodEnum<["fr", "en"]>>;
        notifications: z.ZodOptional<z.ZodObject<{
            emailInvitations: z.ZodDefault<z.ZodBoolean>;
            emailReminders: z.ZodDefault<z.ZodBoolean>;
            pushNotifications: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            emailInvitations?: boolean;
            emailReminders?: boolean;
            pushNotifications?: boolean;
        }, {
            emailInvitations?: boolean;
            emailReminders?: boolean;
            pushNotifications?: boolean;
        }>>;
        ui: z.ZodOptional<z.ZodObject<{
            theme: z.ZodDefault<z.ZodEnum<["light", "dark", "system"]>>;
            defaultGranularity: z.ZodDefault<z.ZodNumber>;
            defaultTimezone: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            theme?: "system" | "light" | "dark";
            defaultGranularity?: number;
            defaultTimezone?: string;
        }, {
            theme?: "system" | "light" | "dark";
            defaultGranularity?: number;
            defaultTimezone?: string;
        }>>;
    }, "strip", z.ZodTypeAny, {
        language?: "fr" | "en";
        notifications?: {
            emailInvitations?: boolean;
            emailReminders?: boolean;
            pushNotifications?: boolean;
        };
        ui?: {
            theme?: "system" | "light" | "dark";
            defaultGranularity?: number;
            defaultTimezone?: string;
        };
    }, {
        language?: "fr" | "en";
        notifications?: {
            emailInvitations?: boolean;
            emailReminders?: boolean;
            pushNotifications?: boolean;
        };
        ui?: {
            theme?: "system" | "light" | "dark";
            defaultGranularity?: number;
            defaultTimezone?: string;
        };
    }>>;
}, "strip", z.ZodTypeAny, {
    fullName?: string;
    timezone?: string;
    preferences?: {
        language?: "fr" | "en";
        notifications?: {
            emailInvitations?: boolean;
            emailReminders?: boolean;
            pushNotifications?: boolean;
        };
        ui?: {
            theme?: "system" | "light" | "dark";
            defaultGranularity?: number;
            defaultTimezone?: string;
        };
    };
}, {
    fullName?: string;
    timezone?: string;
    preferences?: {
        language?: "fr" | "en";
        notifications?: {
            emailInvitations?: boolean;
            emailReminders?: boolean;
            pushNotifications?: boolean;
        };
        ui?: {
            theme?: "system" | "light" | "dark";
            defaultGranularity?: number;
            defaultTimezone?: string;
        };
    };
}>;
export declare const SignUpSchema: z.ZodEffects<z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    confirmPassword: z.ZodString;
    fullName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email?: string;
    fullName?: string;
    password?: string;
    confirmPassword?: string;
}, {
    email?: string;
    fullName?: string;
    password?: string;
    confirmPassword?: string;
}>, {
    email?: string;
    fullName?: string;
    password?: string;
    confirmPassword?: string;
}, {
    email?: string;
    fullName?: string;
    password?: string;
    confirmPassword?: string;
}>;
export declare const SignInSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email?: string;
    password?: string;
}, {
    email?: string;
    password?: string;
}>;
export declare const ConversationCreateSchema: z.ZodObject<{
    sessionId: z.ZodOptional<z.ZodString>;
    initialMessage: z.ZodString;
}, "strip", z.ZodTypeAny, {
    sessionId?: string;
    initialMessage?: string;
}, {
    sessionId?: string;
    initialMessage?: string;
}>;
export declare const MessageCreateSchema: z.ZodObject<{
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    content?: string;
}, {
    content?: string;
}>;
export type PollCreateInput = z.infer<typeof PollCreateSchema>;
export type VoteCreateInput = z.infer<typeof VoteCreateSchema>;
export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;
export type SignUpInput = z.infer<typeof SignUpSchema>;
export type SignInInput = z.infer<typeof SignInSchema>;
export type ConversationCreateInput = z.infer<typeof ConversationCreateSchema>;
export type MessageCreateInput = z.infer<typeof MessageCreateSchema>;
export declare function validatePollData(data: unknown): PollCreateInput;
export declare function validateVoteData(data: unknown): VoteCreateInput;
export declare function validateProfileData(data: unknown): ProfileUpdateInput;
export declare function formatZodError(error: z.ZodError): Record<string, string>;
