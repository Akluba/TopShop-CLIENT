import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { ShopRoutingModule } from './shop-routing.module';

import { ShopListComponent } from './shop-list.component';
import { ShopCreateComponent } from './shop-create.component';

import { ShopService } from './shop.service';
import { ShopListResolver } from './shop-list-resolver.service';

@NgModule({
    imports      : [ SharedModule, ShopRoutingModule ],
    declarations : [ ShopListComponent, ShopCreateComponent ],
    providers    : [ 
        ShopService,
        ShopListResolver
    ]
})
export class ShopModule {}