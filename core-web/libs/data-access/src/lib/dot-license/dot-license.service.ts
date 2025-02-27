import { Observable, Subject, BehaviorSubject, of } from 'rxjs';

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { pluck, map, take, tap } from 'rxjs/operators';

import { ResponseView } from '@dotcms/dotcms-js';
import { DotLicense } from '@dotcms/dotcms-models';

export interface DotUnlicensedPortletData {
    icon: string;
    titleKey: string;
    url: string;
}

const enterprisePorlets: DotUnlicensedPortletData[] = [
    {
        icon: 'tune',
        titleKey: 'com.dotcms.repackage.javax.portlet.title.rules',
        url: '/rules'
    },
    {
        icon: 'cloud_upload',
        titleKey: 'com.dotcms.repackage.javax.portlet.title.publishing-queue',
        url: '/c/publishing-queue'
    },
    {
        icon: 'find_in_page',
        titleKey: 'com.dotcms.repackage.javax.portlet.title.site-search',
        url: '/c/site-search'
    },
    {
        icon: 'person',
        titleKey: 'com.dotcms.repackage.javax.portlet.title.personas',
        url: '/c/c_Personas'
    },
    {
        icon: 'update',
        titleKey: 'com.dotcms.repackage.javax.portlet.title.time-machine',
        url: '/c/time-machine'
    },
    {
        icon: 'device_hub',
        titleKey: 'com.dotcms.repackage.javax.portlet.title.workflow-schemes',
        url: '/c/workflow-schemes'
    },
    {
        icon: 'find_in_page',
        titleKey: 'com.dotcms.repackage.javax.portlet.title.es-search',
        url: '/c/es-search'
    },
    {
        icon: 'business',
        titleKey: 'Forms-and-Form-Builder',
        url: '/forms'
    },
    {
        icon: 'apps',
        titleKey: 'com.dotcms.repackage.javax.portlet.title.apps',
        url: '/apps'
    },
    {
        icon: 'integration_instructions',
        titleKey: 'com.dotcms.repackage.javax.portlet.title.velocity',
        url: '/c/velocity_playground'
    }
];

/**
 * Handle license information of current logged in user
 * @export
 * @class DotLicenseService
 */
@Injectable()
export class DotLicenseService {
    unlicenseData: Subject<DotUnlicensedPortletData> = new BehaviorSubject({
        icon: '',
        titleKey: '',
        url: ''
    });
    private licenseURL: string;

    private license?: DotLicense;

    constructor(private readonly http: HttpClient) {
        this.licenseURL = '/api/v1/appconfiguration';
    }

    /**
     * Gets if current user has an enterprise license
     *
     * @returns Observable<boolean>
     * @memberof DotLicenseService
     */
    isEnterprise(): Observable<boolean> {
        return this.getLicense().pipe(map((license) => license['level'] >= 200));
    }

    /**
     * Verifies if an url is an enterprise portlet and user has enterprise
     *
     * @param string url
     * @returns Observable<boolean>
     * @memberof DotLicenseService
     */
    canAccessEnterprisePortlet(url: string): Observable<boolean> {
        return this.isEnterprise().pipe(
            take(1),
            map((isEnterpriseUser: boolean) => {
                const urlMatch = this.checksIfEnterpriseUrl(url);

                return urlMatch ? urlMatch && isEnterpriseUser : true;
            })
        );
    }

    private checksIfEnterpriseUrl(url: string): boolean {
        const urlMatch = enterprisePorlets.filter((item) => {
            return url.indexOf(item.url) === 0;
        });
        if (urlMatch.length) {
            this.unlicenseData.next(...urlMatch);
        }

        return !!urlMatch.length;
    }

    private getLicense(): Observable<DotLicense> {
        if (this.license) return of(this.license);

        return this.http.get<ResponseView>(this.licenseURL).pipe(
            pluck('entity', 'config', 'license'),
            tap((license) => {
                this.setLicense(license);
            })
        );
    }

    /**
     * Update cached license
     *
     * @memberof DotLicenseService
     */
    updateLicense(): void {
        this.http
            .get<ResponseView>(this.licenseURL)
            .pipe(pluck('entity', 'config', 'license'))
            .subscribe((license) => {
                this.setLicense(license);
            });
    }

    /**
     * Set cached license
     *
     * @param {DotLicense} license
     * @memberof DotLicenseService
     */
    setLicense(license: DotLicense): void {
        this.license = { ...license };
    }
}
