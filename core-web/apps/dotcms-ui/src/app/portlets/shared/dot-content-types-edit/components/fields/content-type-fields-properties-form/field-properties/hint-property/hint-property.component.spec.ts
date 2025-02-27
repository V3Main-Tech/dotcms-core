import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { DotMessageService } from '@dotcms/data-access';
import { DotMessagePipe } from '@dotcms/ui';
import { dotcmsContentTypeFieldBasicMock, MockDotMessageService } from '@dotcms/utils-testing';
import { DotPipesModule } from '@pipes/dot-pipes.module';

import { HintPropertyComponent } from './index';

describe('HintPropertyComponent', () => {
    let comp: HintPropertyComponent;
    let fixture: ComponentFixture<HintPropertyComponent>;
    const messageServiceMock = new MockDotMessageService({
        Hint: 'Hint'
    });

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [HintPropertyComponent],
            imports: [ReactiveFormsModule, DotPipesModule, DotMessagePipe],
            providers: [{ provide: DotMessageService, useValue: messageServiceMock }]
        }).compileComponents();

        fixture = TestBed.createComponent(HintPropertyComponent);
        comp = fixture.componentInstance;
    }));

    it('should have a form', () => {
        const group = new UntypedFormGroup({});
        comp.group = group;
        const divForm: DebugElement = fixture.debugElement.query(By.css('div'));

        expect(divForm).not.toBeNull();
        expect(group).toEqual(divForm.componentInstance.group);
    });

    it('should have a input', () => {
        comp.group = new UntypedFormGroup({
            name: new UntypedFormControl('')
        });
        comp.property = {
            name: 'name',
            value: 'value',
            field: {
                ...dotcmsContentTypeFieldBasicMock
            }
        };

        fixture.detectChanges();

        const pInput: DebugElement = fixture.debugElement.query(By.css('input[type="text"]'));

        expect(pInput).not.toBeNull();
    });
});
