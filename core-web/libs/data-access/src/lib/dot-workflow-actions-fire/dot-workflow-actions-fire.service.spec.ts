/* eslint-disable @typescript-eslint/no-explicit-any */

import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed, getTestBed } from '@angular/core/testing';

import { CoreWebService } from '@dotcms/dotcms-js';
import { DotActionBulkRequestOptions, DotActionBulkResult } from '@dotcms/dotcms-models';
import { CoreWebServiceMock } from '@dotcms/utils-testing';

import { DotWorkflowActionsFireService } from './dot-workflow-actions-fire.service';

const mockBulkOptions: DotActionBulkRequestOptions = {
    workflowActionId: '1',
    contentletIds: ['1'],
    additionalParams: {
        assignComment: {
            comment: 'comment',
            assign: '12345'
        },
        pushPublish: {
            whereToSend: 'w',
            iWantTo: 'i',
            expireDate: 'e',
            expireTime: 'e',
            publishDate: 'p',
            publishTime: 'pp',
            filterKey: 'f',
            timezoneId: 'America/Costa_Rica'
        },
        additionalParamsMap: { _path_to_move: '' }
    }
};

describe('DotWorkflowActionsFireService', () => {
    let injector: TestBed;
    let dotWorkflowActionsFireService: DotWorkflowActionsFireService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                { provide: CoreWebService, useClass: CoreWebServiceMock },
                DotWorkflowActionsFireService
            ]
        });
        injector = getTestBed();
        dotWorkflowActionsFireService = injector.get(DotWorkflowActionsFireService);
        httpMock = injector.inject(HttpTestingController);
    });

    it('should SAVE and return a new contentlet', () => {
        dotWorkflowActionsFireService
            .newContentlet('persona', { name: 'Test' })
            .subscribe((res) => {
                expect(res).toEqual([
                    {
                        name: 'test'
                    }
                ]);
            });

        const req = httpMock.expectOne('v1/workflow/actions/default/fire/NEW');
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual({
            contentlet: {
                contentType: 'persona',
                name: 'Test'
            }
        });
        req.flush({
            entity: [
                {
                    name: 'test'
                }
            ]
        });
    });

    it('should EDIT and return the updated contentlet', () => {
        const fieldName = 'title';

        dotWorkflowActionsFireService
            .saveContentlet({ inode: '123', [fieldName]: 'hello world' })
            .subscribe((res) => {
                expect(res).toEqual([
                    {
                        inode: '123'
                    }
                ]);
            });

        const req = httpMock.expectOne('v1/workflow/actions/default/fire/EDIT?inode=123');
        expect(req.request.method).toBe('PUT');
        // expect(req.request.body).toEqual({
        //     contentlet: {
        //         inode: '123',
        //         [fieldName]: 'hello world'
        //     }
        // });
        req.flush({
            entity: [
                {
                    inode: '123'
                }
            ]
        });
    });

    it('should DESTROY and return the deleted contentlet', () => {
        dotWorkflowActionsFireService.deleteContentlet({ inode: '123' }).subscribe((res) => {
            expect(res).toEqual([
                {
                    inode: '123'
                }
            ]);
        });

        const req = httpMock.expectOne('v1/workflow/actions/default/fire/DESTROY?inode=123');
        expect(req.request.method).toBe('PUT');

        req.flush({
            entity: [
                {
                    inode: '123'
                }
            ]
        });
    });

    it('should PUBLISH and return a new contentlet', () => {
        dotWorkflowActionsFireService
            .publishContentlet('persona', { name: 'test' })
            .subscribe((res) => {
                expect(res).toEqual([
                    {
                        name: 'test'
                    }
                ]);
            });

        const req = httpMock.expectOne('v1/workflow/actions/default/fire/PUBLISH');
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual({
            contentlet: {
                contentType: 'persona',
                name: 'test'
            }
        });
        req.flush({
            entity: [
                {
                    name: 'test'
                }
            ]
        });
    });

    it('should PUBLISH, wait for index and return a new contentlet', () => {
        dotWorkflowActionsFireService
            .publishContentletAndWaitForIndex('persona', { name: 'test' })
            .subscribe((res) => {
                expect(res).toEqual([
                    {
                        name: 'test'
                    }
                ]);
            });

        const req = httpMock.expectOne('v1/workflow/actions/default/fire/PUBLISH');
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual({
            contentlet: {
                contentType: 'persona',
                name: 'test',
                indexPolicy: 'WAIT_FOR'
            }
        });
        req.flush({
            entity: [
                {
                    name: 'test'
                }
            ]
        });
    });

    it('should PUBLISH and Wait For Index with Individual Permissions', () => {
        dotWorkflowActionsFireService
            .publishContentletAndWaitForIndex(
                'persona',
                { name: 'test' },
                { READ: ['123'], WRITE: ['456'] }
            )
            .subscribe((res) => {
                expect(res).toEqual([
                    {
                        name: 'test'
                    }
                ]);
            });

        const req = httpMock.expectOne('v1/workflow/actions/default/fire/PUBLISH');
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual({
            contentlet: {
                contentType: 'persona',
                name: 'test',
                indexPolicy: 'WAIT_FOR'
            },
            individualPermissions: { READ: ['123'], WRITE: ['456'] }
        });
        req.flush({
            entity: [
                {
                    name: 'test'
                }
            ]
        });
    });

    it('should create and return a new Content', () => {
        const data = { id: '123' };
        dotWorkflowActionsFireService.fireTo('123', 'new', data).subscribe((res: any) => {
            expect(res).toEqual([
                {
                    name: 'test'
                }
            ]);
        });

        const req = httpMock.expectOne(
            'v1/workflow/actions/new/fire?inode=123&indexPolicy=WAIT_FOR'
        );
        expect(req.request.method).toBe('PUT');
        req.flush({
            entity: [
                {
                    name: 'test'
                }
            ]
        });
    });

    it('should fire bulk request', () => {
        const mockResult: DotActionBulkResult = {
            skippedCount: 1,
            successCount: 2,
            fails: []
        };
        dotWorkflowActionsFireService.bulkFire(mockBulkOptions).subscribe((res) => {
            expect(res).toEqual(mockResult);
        });

        const req = httpMock.expectOne('/api/v1/workflow/contentlet/actions/bulk/fire');
        expect(req.request.method).toBe('PUT');
        req.flush({
            entity: mockResult
        });
    });

    afterEach(() => {
        httpMock.verify();
    });
});
