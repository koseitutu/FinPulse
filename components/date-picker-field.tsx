// Platform-specific implementations:
//   date-picker-field.native.tsx  →  iOS + Android (DateTimePicker)
//   date-picker-field.web.tsx     →  Web (native <input type="date">)
// This file satisfies TypeScript when resolving the module path.

export { DatePickerField } from './date-picker-field.web';
