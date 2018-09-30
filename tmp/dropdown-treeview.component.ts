import { Component, EventEmitter, Input, Output, HostListener, ViewChild, TemplateRef } from '@angular/core';
import { TreeviewI18n } from './treeview-i18n';
import { TreeviewItem } from './treeview-item';
import { TreeviewConfig } from './treeview-config';
import { TreeviewComponent } from './treeview.component';
import { DropdownDirective } from './dropdown.directive';
import { TreeviewHeaderTemplateContext } from './treeview-header-template-context';
import { TreeviewItemTemplateContext } from './treeview-item-template-context';

@Component({
    selector: 'ngx-dropdown-treeview',
    template: `
      <div class="dropdown" ngxDropdown>
        <button class="btn" [ngClass]="buttonClass" type="button" role="button" ngxDropdownToggle>
          {{getText()}}
        </button>
        <div ngxDropdownMenu aria-labelledby="dropdownMenu" (click)="$event.stopPropagation()">
          <div class="dropdown-container">
            <ngx-treeview [config]="config" [headerTemplate]="headerTemplate" [items]="items" [itemTemplate]="itemTemplate" (selectedChange)="onSelectedChange($event)"
              (filterChange)="onFilterChange($event)">
            </ngx-treeview>
          </div>
        </div>
      </div>
    `,
    styles: [`
      .dropdown {
        width: 100%;
        display: inline-block;
      }

      .dropdown button {
        width: 100%;
        margin-right: .9rem;
        text-align: left;
      }

      .dropdown button::after {
        position: absolute;
        right: .6rem;
        margin-top: .6rem;
      }

      .dropdown .dropdown-menu .dropdown-container {
        padding: 0 .6rem;
      }
    `]
})
export class DropdownTreeviewComponent {
    @Input() buttonClass = 'btn-outline-secondary';
    @Input() headerTemplate: TemplateRef<TreeviewHeaderTemplateContext>;
    @Input() itemTemplate: TemplateRef<TreeviewItemTemplateContext>;
    @Input() items: TreeviewItem[];
    @Input() config: TreeviewConfig;
    @Output() selectedChange = new EventEmitter<any[]>(true);
    @Output() filterChange = new EventEmitter<string>();
    @ViewChild(TreeviewComponent) treeviewComponent: TreeviewComponent;
    @ViewChild(DropdownDirective) dropdownDirective: DropdownDirective;

    constructor(
        public i18n: TreeviewI18n,
        private defaultConfig: TreeviewConfig
    ) {
        this.config = this.defaultConfig;
    }

    getText(): string {
        return this.i18n.getText(this.treeviewComponent.selection);
    }

    onSelectedChange(values: any[]) {
        this.selectedChange.emit(values);
    }

    onFilterChange(text: string) {
      this.filterChange.emit(text);
    }
}
