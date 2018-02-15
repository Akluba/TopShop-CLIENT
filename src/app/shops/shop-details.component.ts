import { Component, OnInit, AfterViewInit, OnChanges, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl, ValidatorFn, FormArray } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';

import { ShopService } from './shop.service';
import { AuthService } from '../core/auth.service';

declare let $: any;

export class LogEntry {
    id = 0;
    source_class = 'Shop';
    source_id: number;
    field_id: number;
    log_field1: string = null;
    log_field2: string = null;
    log_field3: string = null;
    log_field4: string = null;
    log_field5: string = null;
    log_field6: string = null;
    log_field7: string = null;
    log_field8: string = null;
    log_field9: string = null;
    log_field10: string = null;

    constructor(source_id, field_id, log_field1?, log_field2?) {
        this.source_id  = source_id;
        this.field_id   = field_id;
        this.log_field1 = log_field1;
        this.log_field2 = log_field2;
    }
}

@Component({
    templateUrl: 'shop-details.component.html'
})
export class ShopDetailsComponent implements OnInit, AfterViewInit, OnDestroy {
    shop;
    shopNameField = true;
    formElements;
    shopForm: FormGroup;
    message: {};

    private sub: Subscription;

    constructor(
        private _fb: FormBuilder,
        private _route: ActivatedRoute,
        private _shopService: ShopService,
        private _authService: AuthService) {}

    ngOnInit(): void {
        // Read the data from the resolver.
        this.sub = this._route.data.subscribe(data => {
            this.shop = data.response.data.shop;
            this.formElements = data.response.data.form_elements;

            this.buildShopForm();
            this.populateShopForm();
        });
    }

    ngAfterViewInit(): void {
        $('.secondary.menu .item').tab({context: 'parent'});
        $('.notes.menu .item').tab();
    }

    ngOnDestroy(): void {
        this.sub.unsubscribe();
    }

    buildShopForm(): void {
        const field_controls = {};

        this.formElements.forEach(category => {
            category.fields.forEach(field => {
                field_controls[field.column_name] = null;
            });
        });

        field_controls['name'] = null;

        // Build the shopForm controls.
        this.shopForm = this._fb.group(field_controls);
        console.log(this.shopForm);
    }

    formatInputValues(type, value): any {
        if (type === 'select_multiple') {
            return JSON.parse(value);
        } else if (type === 'checkbox') {
            return (value === '1') ? true : false;
        } else {
            return value;
        }
    }

    populateShopForm(): void {
        const field_values = {};

        this.formElements.forEach(category => {
            category.fields.forEach(field => {
                if (this._noteOrLogField(field.type)) {
                    this.setExistingLogEntries(field);
                    this.addLogEntry(field);
                } else {
                    field_values[field.column_name] = this.formatInputValues(field.type, this.shop[field.column_name]);
                }
            });
        });

        field_values['name'] = this.shop.name;

        // Populate shopForm with data.
        this.shopForm.patchValue(field_values);
    }

    formatFG(field, logEntry): FormGroup {
        field.columns.forEach(column => {
            logEntry[column.column_name] = this.formatInputValues(column.type, logEntry[column.column_name]);
        });

        logEntry['deleted'] = null;

        return this._fb.group(logEntry);
    }

    setExistingLogEntries(field): void {
        const control = field.column_name;

        if (this.shop[control]) {
            const logEntryFGs = this.shop[control].map(logEntry => this.formatFG(field, logEntry));
            const logEntryFA = this._fb.array(logEntryFGs);
            this.shopForm.setControl(control, logEntryFA);
        } else {
            this.shopForm.setControl(control, this._fb.array([]));
        }
    }

    addLogEntry(field): void {
        const control = field.column_name;
        const fieldId = field.id;
        let newLogEntry;

        // Get the existing log entry form array.
        let logEntryFA = this.getLogEntryFA(control);
        const logEntryFGs = (logEntryFA.controls) ? logEntryFA.controls : [];

        // Position the new log entry control in index 0.
        if (field.type === 'notes') {
            const user = this._authService.currentUser.id;
            const today = new Date();
            const date = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
            newLogEntry = new LogEntry(this.shop['id'], fieldId, user, date);
        } else {
            newLogEntry = new LogEntry(this.shop['id'], fieldId);
        }

        const newLogEntryFG = this._fb.group(newLogEntry);
        logEntryFGs.unshift(newLogEntryFG);

        // Set the form array control with the new log entry included.
        logEntryFA = this._fb.array(logEntryFGs);
        this.shopForm.setControl(control, logEntryFA);
    }

    getLogEntryFA(control): FormArray {
        return this.shopForm.get(control) as FormArray;
    }

    logEntryPristine(control): boolean {
        const logEntryFA = this.getLogEntryFA(control);
        const newLogEntry = logEntryFA.controls[0];

        return newLogEntry.pristine;
    }

    flashMessage(message): void {
        $('.message').addClass(message.status);

        this.message = message;

        $('.message')
        .transition('fade', 1000)
        .transition('fade', 1000);
    }

    logEntryDeleted(control): boolean {
        const logEntryFA = this.getLogEntryFA(control);
        if (logEntryFA.pristine) {
            return false;
        }

        const logEntryFGs = logEntryFA.value;

        for (let i = 0; i < logEntryFGs.length; i++) {
            if (logEntryFGs[i]['deleted'] === true) {
                return true;
            }
        }

        return false;
    }

    updateLoggingFields(): void {
        this.formElements.forEach(category => {
            category.fields.forEach(field => {
                if (
                    this._noteOrLogField(field.type)
                    && (!this.logEntryPristine(field.column_name) || this.logEntryDeleted(field.column_name))
                ) {
                    this.setExistingLogEntries(field);
                    this.addLogEntry(field);
                }
            });
        });
    }

    onSaveComplete(response: any): void {
        // store the new shop object.
        this.shop = response.data;
        this.updateLoggingFields();

        // clear the flags and display success message.
        this.shopForm.markAsPristine();
        this.flashMessage({text: response.message, status: 'success'});
    }

    formatBody(body): void {
        this.formElements.forEach(category => {
            category.fields.forEach(field => {
                if (this._noteOrLogField(field.type) && this.logEntryPristine(field.column_name)) {
                    body[field.column_name].splice(0, 1);
                } else if (field.type === 'select_multiple' && body[field.column_name] != null) {
                    body[field.column_name] = JSON.stringify(body[field.column_name]);
                }
            });
        });

        return body;
    }

    save(): void {
        if (this.shopForm.dirty && this.shopForm.valid) {
            // Copy the form values over the rawShopData object values.
            let body = Object.assign({}, this.shop, this.shopForm.value);
            body = this.formatBody(body);

            this._shopService.save(body)
                .subscribe(
                    response => this.onSaveComplete(response),
                    (error: any) => this.flashMessage({text: <any>error, status: 'negative'})
                );
        }
    }

    private _noteOrLogField(type): boolean {
        return $.inArray(type, ['log', 'notes']) !== -1;
    }

}
