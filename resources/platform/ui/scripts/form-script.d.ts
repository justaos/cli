/// <reference types="jquery" />
declare class FormScript {
    fields: any;
    fieldMap: any;
    formType: any;
    form: any;
    constructor(fields: any, formType: any);
    isCreateForm(): boolean;
    isEditForm(): boolean;
    getLabel(fieldName: any): any;
    getValue(fieldName: any): any;
    setValue(fieldName: any, value: any): void;
    setDisplay(fieldName: any, display: any): void;
    getElement(fieldName: any): JQuery<HTMLElement>;
    addErrorMessage(htmlMessage: any): void;
    clearAlertMessages(): void;
    setMandatory(fieldName: any, mandatory: any): void;
    isMandatory(fieldName: any): any;
    setReadOnly(fieldName: any, readOnly: any): void;
    getRecord(): any;
    _attachListeners(): void;
    fireCallBacks(field: any): void;
    callBacks: any;
    onChange(callBack: any): void;
    submit(): void;
}
