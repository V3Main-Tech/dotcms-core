import { Subject } from 'rxjs';

import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';

import { take, takeUntil } from 'rxjs/operators';

import { DotHttpErrorManagerService } from '@dotcms/app/api/services/dot-http-error-manager/dot-http-error-manager.service';
import { DotCMSContentTypeField, DotFieldVariable } from '@dotcms/dotcms-models';
import { DotKeyValue } from '@shared/models/dot-key-value-ng/dot-key-value-ng.model';

import { DotFieldVariablesService } from './services/dot-field-variables.service';

@Component({
    selector: 'dot-content-type-fields-variables',
    styleUrls: ['./dot-content-type-fields-variables.component.scss'],
    templateUrl: './dot-content-type-fields-variables.component.html'
})
export class DotContentTypeFieldsVariablesComponent implements OnChanges, OnDestroy {
    @Input()
    field: DotCMSContentTypeField;

    fieldVariables: DotFieldVariable[] = [];
    blackList = {
        'com.dotcms.contenttype.model.field.ImmutableStoryBlockField': {
            allowedBlocks: true
            // contentAssets: true
        }
    };

    private destroy$: Subject<boolean> = new Subject<boolean>();

    constructor(
        private dotHttpErrorManagerService: DotHttpErrorManagerService,
        private fieldVariablesService: DotFieldVariablesService
    ) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.field.currentValue) {
            this.initTableData();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next(true);
        this.destroy$.complete();
    }

    /**
     * Handle Delete event doing a Delete to the Backend
     * @param {DotKeyValue} variable
     * @memberof DotContentTypeFieldsVariablesComponent
     */
    deleteExistingVariable(variable: DotKeyValue): void {
        this.fieldVariablesService
            .delete(this.field, variable)
            .pipe(take(1))
            .subscribe(
                () => {
                    this.fieldVariables = this.fieldVariables.filter(
                        (item: DotFieldVariable) => item.key !== variable.key
                    );
                },
                (err: HttpErrorResponse) => {
                    this.dotHttpErrorManagerService.handle(err).pipe(take(1)).subscribe();
                }
            );
    }

    /**
     * Handle Save event doing a Post to the Backend
     * @param {DotKeyValue} variable
     * @memberof DotContentTypeFieldsVariablesComponent
     */
    updateExistingVariable(variable: DotKeyValue): void {
        this.fieldVariablesService
            .save(this.field, variable)
            .pipe(take(1))
            .subscribe(
                (savedVariable: DotFieldVariable) => {
                    this.fieldVariables = this.updateVariableCollection(savedVariable);
                },
                (err: HttpErrorResponse) => {
                    this.dotHttpErrorManagerService.handle(err).pipe(take(1)).subscribe();
                }
            );
    }

    private initTableData(): void {
        this.fieldVariablesService
            .load(this.field)
            .pipe(takeUntil(this.destroy$))
            .subscribe((fieldVariables: DotFieldVariable[]) => {
                this.fieldVariables = fieldVariables.filter((item) => {
                    const fieldBlackList = this.blackList[this.field.clazz];
                    if (fieldBlackList) {
                        return !fieldBlackList[item?.key];
                    }

                    return true;
                });
            });
    }

    private updateVariableCollection(savedVariable: DotFieldVariable): DotFieldVariable[] {
        const variableExist = this.fieldVariables.find(
            (item: DotKeyValue) => item.key === savedVariable.key
        );

        return variableExist
            ? this.fieldVariables.map((item: DotFieldVariable) => {
                  if (item.key === savedVariable.key) {
                      item = savedVariable;
                  }

                  return item;
              })
            : [savedVariable, ...this.fieldVariables];
    }
}
