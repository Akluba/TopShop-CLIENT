import { Component } from '@angular/core';

import { ManagerService } from './manager.service';

@Component({
    templateUrl: 'manager-list.component.html'
})
export class ManagerListComponent {
    constructor(private _managerService: ManagerService) {}
}