import { Component, Input, Output, EventEmitter, SimpleChanges, OnChanges, TemplateRef } from '@angular/core';
import { isNil, includes } from 'lodash';
import { TreeviewI18n } from './treeview-i18n';
import { TreeviewItem, TreeviewSelection } from './treeview-item';
import { TreeviewConfig } from './treeview-config';
import { TreeviewEventParser } from './treeview-event-parser';
import { TreeviewHeaderTemplateContext } from './treeview-header-template-context';
import { TreeviewItemTemplateContext } from './treeview-item-template-context';
import { TreeviewHelper } from './treeview-helper';

class FilterTreeviewItem extends TreeviewItem {
    private readonly refItem: TreeviewItem;
    constructor(item: TreeviewItem) {
        super({
            text: item.text,
            value: item.value,
            disabled: item.disabled,
            checked: item.checked,
            collapsed: item.collapsed,
            children: item.children
        });
        this.refItem = item;
    }

    updateRefChecked() {
        this.children.forEach(child => {
            if (child instanceof FilterTreeviewItem) {
                child.updateRefChecked();
            }
        });

        let refChecked = this.checked;
        if (refChecked) {
            for (const refChild of this.refItem.children) {
                if (!refChild.checked) {
                    refChecked = false;
                    break;
                }
            }
        }
        this.refItem.checked = refChecked;
    }
}

@Component({
    selector: 'ngx-treeview',
    template: `
      <ng-template #defaultItemTemplate let-item="item" let-onCollapseExpand="onCollapseExpand" let-onCheckedChange="onCheckedChange">
        <div class="form-inline row-item">
          <i *ngIf="item.children" (click)="onCollapseExpand()" aria-hidden="true" class="fa" [class.fa-caret-right]="item.collapsed"
            [class.fa-caret-down]="!item.collapsed"></i>
          <div class="form-check">
            <input type="checkbox" class="form-check-input" [(ngModel)]="item.checked" (ngModelChange)="onCheckedChange()" [disabled]="item.disabled"
              [indeterminate]="item.indeterminate" />
            <label class="form-check-label" (click)="item.checked = !item.checked; onCheckedChange()">
              {{item.text}}
            </label>
          </div>
        </div>
      </ng-template>
      <ng-template #defaultHeaderTemplate let-config="config" let-item="item" let-onCollapseExpand="onCollapseExpand" let-onCheckedChange="onCheckedChange"
        let-onFilterTextChange="onFilterTextChange">
        <div *ngIf="config.hasFilter" class="row row-filter">
          <div class="col-12">
            <input class="form-control" type="text" [placeholder]="i18n.getFilterPlaceholder()" [(ngModel)]="filterText" (ngModelChange)="onFilterTextChange($event)"
            />
          </div>
        </div>
        <div *ngIf="hasFilterItems">
          <div *ngIf="config.hasAllCheckBox || config.hasCollapseExpand" class="row row-all">
            <div class="col-12">
              <div class="form-check">
                <input type="checkbox" class="form-check-input" [(ngModel)]="item.checked" (ngModelChange)="onCheckedChange()" [indeterminate]="item.indeterminate"
                />
                <label *ngIf="config.hasAllCheckBox" class="form-check-label" (click)="item.checked = !item.checked; onCheckedChange()">
                  {{i18n.getAllCheckboxText()}}
                </label>
                <label *ngIf="config.hasCollapseExpand" class="pull-right form-check-label" (click)="onCollapseExpand()">
                  <i [title]="i18n.getTooltipCollapseExpandText(item.collapsed)" aria-hidden="true" class="fa" [class.fa-expand]="item.collapsed"
                    [class.fa-compress]="!item.collapsed"></i>
                </label>
              </div>
            </div>
          </div>
          <div *ngIf="config.hasDivider" class="dropdown-divider"></div>
        </div>
      </ng-template>
      <div class="treeview-header">
        <ng-template [ngTemplateOutlet]="headerTemplate || defaultHeaderTemplate" [ngTemplateOutletContext]="headerTemplateContext">
        </ng-template>
      </div>
      <div [ngSwitch]="hasFilterItems">
        <div *ngSwitchCase="true" class="treeview-container" [style.max-height.px]="maxHeight">
          <ngx-treeview-item *ngFor="let item of filterItems" [config]="config" [item]="item" [template]="itemTemplate || defaultItemTemplate"
            (checkedChange)="onItemCheckedChange(item, $event)">
          </ngx-treeview-item>
        </div>
        <div *ngSwitchCase="false" class="treeview-text">
          {{i18n.getFilterNoItemsFoundText()}}
        </div>
      </div>
    `,
    styles: [`
      :host /deep/ .treeview-header .row-filter {
        margin-bottom: .5rem;
      }

      :host /deep/ .treeview-header .row-all .fa {
        cursor: pointer;
      }

      :host /deep/ .treeview-container .row-item {
        margin-bottom: .3rem;
        flex-wrap: nowrap;
      }

      :host /deep/ .treeview-container .row-item .fa {
        width: .8rem;
        cursor: pointer;
        margin-right: .3rem;
      }

      .treeview-container {
        overflow-y: auto;
        padding-right: .3rem;
      }

      .treeview-text {
        padding: .3rem 0;
        white-space: nowrap;
      }
    `]
})
export class TreeviewComponent implements OnChanges {
    @Input() headerTemplate: TemplateRef<TreeviewHeaderTemplateContext>;
    @Input() itemTemplate: TemplateRef<TreeviewItemTemplateContext>;
    @Input() items: TreeviewItem[];
    @Input() config: TreeviewConfig;
    @Output() selectedChange = new EventEmitter<any[]>();
    @Output() filterChange = new EventEmitter<string>();
    headerTemplateContext: TreeviewHeaderTemplateContext;
    allItem: TreeviewItem;
    filterText = '';
    filterItems: TreeviewItem[];
    selection: TreeviewSelection;

    constructor(
        public i18n: TreeviewI18n,
        private defaultConfig: TreeviewConfig,
        private eventParser: TreeviewEventParser
    ) {
        this.config = this.defaultConfig;
        this.allItem = new TreeviewItem({ text: 'All', value: undefined });
        this.createHeaderTemplateContext();
    }

    get hasFilterItems(): boolean {
        return !isNil(this.filterItems) && this.filterItems.length > 0;
    }

    get maxHeight(): string {
        return `${this.config.maxHeight}`;
    }

    ngOnChanges(changes: SimpleChanges) {
        const itemsSimpleChange = changes['items'];
        if (!isNil(itemsSimpleChange)) {
            if (!isNil(this.items)) {
                this.updateFilterItems();
                this.updateCollapsedOfAll();
                this.raiseSelectedChange();
            }
        }
        this.createHeaderTemplateContext();
    }

    onAllCollapseExpand() {
        this.allItem.collapsed = !this.allItem.collapsed;
        this.filterItems.forEach(item => item.setCollapsedRecursive(this.allItem.collapsed));
    }

    onFilterTextChange(text: string) {
        this.filterText = text;
        this.filterChange.emit(text);
        this.updateFilterItems();
    }

    onAllCheckedChange() {
        const checked = this.allItem.checked;
        this.filterItems.forEach(item => {
            item.setCheckedRecursive(checked);
            if (item instanceof FilterTreeviewItem) {
                item.updateRefChecked();
            }
        });

        this.raiseSelectedChange();
    }

    onItemCheckedChange(item: TreeviewItem, checked: boolean) {
        if (item instanceof FilterTreeviewItem) {
            item.updateRefChecked();
        }

        this.updateCheckedOfAll();
        this.raiseSelectedChange();
    }

    raiseSelectedChange() {
        this.generateSelection();
        const values = this.eventParser.getSelectedChange(this);
        this.selectedChange.emit(values);
    }

    private createHeaderTemplateContext() {
        this.headerTemplateContext = {
            config: this.config,
            item: this.allItem,
            onCheckedChange: () => this.onAllCheckedChange(),
            onCollapseExpand: () => this.onAllCollapseExpand(),
            onFilterTextChange: (text) => this.onFilterTextChange(text)
        };
    }

    private generateSelection() {
        let checkedItems: TreeviewItem[] = [];
        let uncheckedItems: TreeviewItem[] = [];
        if (!isNil(this.items)) {
            const selection = TreeviewHelper.concatSelection(this.items, checkedItems, uncheckedItems);
            checkedItems = selection.checked;
            uncheckedItems = selection.unchecked;
        }

        this.selection = {
            checkedItems: checkedItems,
            uncheckedItems: uncheckedItems
        };
    }

    private updateFilterItems() {
        if (this.filterText !== '') {
            const filterItems: TreeviewItem[] = [];
            const filterText = this.filterText.toLowerCase();
            this.items.forEach(item => {
                const newItem = this.filterItem(item, filterText);
                if (!isNil(newItem)) {
                    filterItems.push(newItem);
                }
            });
            this.filterItems = filterItems;
        } else {
            this.filterItems = this.items;
        }

        this.updateCheckedOfAll();
    }

    private filterItem(item: TreeviewItem, filterText: string): TreeviewItem {
        const isMatch = includes(item.text.toLowerCase(), filterText);
        if (isMatch) {
            return item;
        } else {
            if (!isNil(item.children)) {
                const children: TreeviewItem[] = [];
                item.children.forEach(child => {
                    const newChild = this.filterItem(child, filterText);
                    if (!isNil(newChild)) {
                        children.push(newChild);
                    }
                });
                if (children.length > 0) {
                    const newItem = new FilterTreeviewItem(item);
                    newItem.collapsed = false;
                    newItem.children = children;
                    return newItem;
                }
            }
        }

        return undefined;
    }

    private updateCheckedOfAll() {
        let itemChecked: boolean = null;
        for (const filterItem of this.filterItems) {
            if (itemChecked === null) {
                itemChecked = filterItem.checked;
            } else if (itemChecked !== filterItem.checked) {
                itemChecked = undefined;
                break;
            }
        }

        if (itemChecked === null) {
            itemChecked = false;
        }

        this.allItem.checked = itemChecked;
    }

    private updateCollapsedOfAll() {
        let hasItemExpanded = false;
        for (const filterItem of this.filterItems) {
            if (!filterItem.collapsed) {
                hasItemExpanded = true;
                break;
            }
        }

        this.allItem.collapsed = !hasItemExpanded;
    }
}
