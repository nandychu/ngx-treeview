import { Component, EventEmitter, Input, Output, TemplateRef } from '@angular/core';
import { isNil } from 'lodash';
import { TreeviewItem } from './treeview-item';
import { TreeviewConfig } from './treeview-config';
import { TreeviewItemTemplateContext } from './treeview-item-template-context';

@Component({
    selector: 'ngx-treeview-item',
    template: `
      <div *ngIf="item" class="treeview-item">
          <ng-template [ngTemplateOutlet]="template" [ngTemplateOutletContext]="{item: item, onCollapseExpand: onCollapseExpand, onCheckedChange: onCheckedChange}">
          </ng-template>
          <div *ngIf="!item.collapsed">
              <ngx-treeview-item [config]="config" *ngFor="let child of item.children" [item]="child" [template]="template" (checkedChange)="onChildCheckedChange(child, $event)">
              </ngx-treeview-item>
          </div>
      </div>
    `,
    styles: [`
      :host {
        display: block;
      }

      :host .treeview-item {
        white-space: nowrap;
      }

      :host .treeview-item .treeview-item {
        margin-left: 2rem;
      }
    `]
})
export class TreeviewItemComponent {
    @Input() config: TreeviewConfig;
    @Input() template: TemplateRef<TreeviewItemTemplateContext>;
    @Input() item: TreeviewItem;
    @Output() checkedChange = new EventEmitter<boolean>();

    constructor(
        private defaultConfig: TreeviewConfig
    ) {
        this.config = this.defaultConfig;
    }

    onCollapseExpand = () => {
        this.item.collapsed = !this.item.collapsed;
    }

    onCheckedChange = () => {
        const checked = this.item.checked;
        if (!isNil(this.item.children) && !this.config.decoupleChildFromParent) {
            this.item.children.forEach(child => child.setCheckedRecursive(checked));
        }
        this.checkedChange.emit(checked);
    }

    onChildCheckedChange(child: TreeviewItem, checked: boolean) {
        if (!this.config.decoupleChildFromParent) {
            let itemChecked: boolean = null;
            for (const childItem of this.item.children) {
                if (itemChecked === null) {
                    itemChecked = childItem.checked;
                } else if (itemChecked !== childItem.checked) {
                    itemChecked = undefined;
                    break;
                }
            }

            if (itemChecked === null) {
                itemChecked = false;
            }

            if (this.item.checked !== itemChecked) {
                this.item.checked = itemChecked;
            }

        }

        this.checkedChange.emit(checked);
    }
}
