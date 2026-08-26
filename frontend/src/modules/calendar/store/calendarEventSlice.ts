import type { CalendarEvent, CalendarNotification, ReminderUnit } from "../types";

export type CalendarEventFormState = {
  formData: Partial<CalendarEvent>;
  isCustomReminderOpen: boolean;
  customReminderType: "relative" | "absolute";
  customVal: string;
  customUnit: ReminderUnit;
  customDate: string;
  customTime: string;
};

export const createInitialFormState = (
  event?: CalendarEvent | null,
  selectedDate?: Date | null
): CalendarEventFormState => {
  if (event) {
    return {
      formData: { ...event, notifications: event.notifications || [] },
      isCustomReminderOpen: false,
      customReminderType: "relative",
      customVal: "1",
      customUnit: "hours",
      customDate: "",
      customTime: "09:00",
    };
  }

  return {
    formData: {
      title: "",
      date: selectedDate || new Date(),
      type: "meeting",
      allDay: false,
      time: "10:00",
      endTime: "11:00",
      location: "",
      description: "",
      notifications: [],
      client: "",
      assignee: "",
      notifyClient: false,
      clientNotifyChannel: "email",
      createFollowUpTask: false,
      notifyAssignee: false,
      assigneeNotifyChannel: "app",
    },
    isCustomReminderOpen: false,
    customReminderType: "relative",
    customVal: "1",
    customUnit: "hours",
    customDate: "",
    customTime: "09:00",
  };
};

export function calendarEventReducer(
  state: CalendarEventFormState,
  action: { type: string; payload?: any }
): CalendarEventFormState {
  switch (action.type) {
    case "SET_FIELD": {
      const { field, value } = action.payload;
      return { ...state, formData: { ...(state.formData || {}), [field]: value } };
    }

    case "SET_FORM": {
      return { ...state, formData: action.payload };
    }

    case "RESET_FORM": {
      return createInitialFormState(null, action.payload);
    }

    case "SET_CUSTOM_REMINDER_OPEN": {
      return { ...state, isCustomReminderOpen: !!action.payload };
    }

    case "SET_CUSTOM_FIELD": {
      const { name, value } = action.payload;
      return { ...(state as any), [name]: value } as CalendarEventFormState;
    }

    case "ADD_PRESET_REMINDER": {
      const preset = action.payload as string;
      const newId = Math.random().toString(36).substr(2, 9);
      let newReminder: CalendarNotification | null = null;
      if (preset === "15min") newReminder = { id: newId, type: "relative", value: 15, unit: "minutes" };
      if (preset === "1hour") newReminder = { id: newId, type: "relative", value: 1, unit: "hours" };
      if (preset === "2hours") newReminder = { id: newId, type: "relative", value: 2, unit: "hours" };
      if (preset === "1day") newReminder = { id: newId, type: "relative", value: 1, unit: "days" };
      if (!newReminder) return state;
      return {
        ...state,
        formData: { ...(state.formData || {}), notifications: [...(state.formData.notifications || []), newReminder] },
      };
    }

    case "ADD_CUSTOM_REMINDER": {
      const newId = Math.random().toString(36).substr(2, 9);
      let newReminder: CalendarNotification;
      if (state.customReminderType === "relative") {
        newReminder = { id: newId, type: "relative", value: parseInt(state.customVal, 10) || 1, unit: state.customUnit };
      } else {
        newReminder = { id: newId, type: "absolute", value: `${state.customDate}T${state.customTime}` };
      }
      return {
        ...state,
        formData: { ...(state.formData || {}), notifications: [...(state.formData.notifications || []), newReminder] },
        isCustomReminderOpen: false,
        customVal: "1",
        customUnit: "hours",
        customDate: "",
        customTime: "09:00",
      };
    }

    case "REMOVE_REMINDER": {
      const id = action.payload as string;
      return {
        ...state,
        formData: { ...(state.formData || {}), notifications: (state.formData.notifications || []).filter((n) => n.id !== id) },
      };
    }

    default:
      return state;
  }
}

// Action creators (local-slice style)
export const setField = (field: keyof CalendarEvent, value: any) => ({ type: "SET_FIELD", payload: { field, value } } as const);
export const setForm = (form: Partial<CalendarEvent>) => ({ type: "SET_FORM", payload: form } as const);
export const resetForm = (selectedDate?: Date | null) => ({ type: "RESET_FORM", payload: selectedDate } as const);
export const setCustomReminderOpen = (open: boolean) => ({ type: "SET_CUSTOM_REMINDER_OPEN", payload: open } as const);
export const setCustomField = (payload: { name: string; value: any }) => ({ type: "SET_CUSTOM_FIELD", payload } as const);
export const addPresetReminder = (preset: string) => ({ type: "ADD_PRESET_REMINDER", payload: preset } as const);
export const addCustomReminder = () => ({ type: "ADD_CUSTOM_REMINDER" } as const);
export const removeReminder = (id: string) => ({ type: "REMOVE_REMINDER", payload: id } as const);
