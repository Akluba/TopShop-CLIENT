import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';

import { SetupService } from './setup.service';

declare var $ :any;

@Component({
    templateUrl: 'field-options.component.html'
})
export class FieldOptionsComponent implements OnInit{
    errorMessage: string;
    successMessage: string;
    category: any;
    field: any;
    options: Array<any>;
    newOption: Observable<{}>;

    route: string;

    constructor(private _route: ActivatedRoute, private _setupService: SetupService) {}

    ngOnInit(): void {
        this._route.parent.data.subscribe(data => {
            this.field = data['field'].data;

            this.category = this.field.category;
            this.options = this.field.options;
        });

        this._route.data.subscribe(data => {
            this.route = data['route'];
        });
    }

    saveOption(option): void {
        this._setupService.save(option, {route: 'option'})
        .subscribe(
            option => this.onSaveComplete(option),
            (error: any) => this.errorMessage = <any>error
        )
    }

    createOption():void {
        this.newOption = this.initNewOption()
            .do(() => $('.ui.modal.new-option').modal('show'));
    }

    initNewOption() {
        return of({
            id: 0,
            source_id: this.field.id,
            source_class: 'CustomField',
            label: null
        });
    }

    onSaveComplete(option: any): void {
        if (option.method === 'create') {
            this.options.push(option.data);
        }
        else if (option.method === 'delete') {
            this.options = this.options.filter(obj => obj.id != option.data.id);
        }
        
        this.successMessage = option.message;
    }

}