// also exported from '@storybook/angular' if you can deal with breaking changes in 6.1
import { moduleMetadata } from '@storybook/angular';
import { Meta, Story } from '@storybook/angular/types-6-0';
import { UPDATE_STORY_ARGS } from '@storybook/core-events';

import { BrowserModule } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { AutoComplete, AutoCompleteModule } from 'primeng/autocomplete';

import type { Channel } from '@storybook/channels';

const originalData = [
    { name: 'Afghanistan', code: 'AF' },
    { name: 'Albania', code: 'AL' },
    { name: 'Venezuela', code: 'VE' },
    { name: 'Vietnam', code: 'VN' },
    { name: 'Zimbabwe', code: 'ZW' },
    { name: 'Zambia', code: 'ZM' },
    { name: 'Yemen', code: 'YE' },
    { name: 'Western Sahara', code: 'EH' },
    { name: 'Wallis and Futuna', code: 'WF' },
    { name: 'Virgin Islands (U.S.)', code: 'VI' },
    { name: 'Virgin Islands (British)', code: 'VG' },
    { name: 'Viet Nam', code: 'VN' },
    { name: 'Vanuatu', code: 'VU' },
    { name: 'Uzbekistan', code: 'UZ' },
    { name: 'Uruguay', code: 'UY' },
    { name: 'United States', code: 'US' },
    { name: 'United States Minor Outlying Islands', code: 'UM' }
];

export default {
    title: 'PrimeNG/Form/AutoComplete',
    component: AutoComplete,
    parameters: {
        docs: {
            description: {
                component:
                    'AutoComplete is an input component that provides real-time suggestions when being typed: https://primeng.org/autocomplete'
            }
        }
    },
    decorators: [
        moduleMetadata({
            imports: [AutoCompleteModule, NoopAnimationsModule, BrowserModule]
        })
    ],
    args: {
        suggestions: [...originalData],
        dropdown: true,
        multiple: false,
        field: 'name',
        showClear: false,
        dropdownIcon: 'pi pi-chevron-down',
        delay: 300,
        unique: true
    },

    argTypes: {
        dropdown: {
            control: 'boolean',
            description: 'Show or hide the dropdown button'
        },
        showClear: {
            control: 'boolean',
            description: 'Show or hide the clear button'
        },
        multiple: {
            control: 'boolean',
            description: 'Allow multiple values'
        },
        unique: {
            control: 'boolean',
            description: 'Allow only unique values',
            if: {
                arg: 'multiple'
            }
        },
        field: {
            control: 'select',
            options: ['name', 'code'],
            description: 'Field to use as label of the object'
        },
        dropdownIcon: {
            control: 'text',
            description: 'Icon to use in the dropdown button (check primeNG icons)'
        },
        delay: {
            control: 'number',
            description: 'Delay in milliseconds before the suggestions are shown'
        },
        suggestions: {
            table: {
                disable: true
            }
        }
    }
} as Meta;

// First arguments is the Args from Meta, the second one is the whole storybook context
export const Main: Story = (args, { id }) => {
    return {
        props: {
            ...args,
            filterCountries: ({ query }: { query: string }) => {
                // This hack is to emit a change and update the story args https://github.com/storybookjs/storybook/issues/17089#issuecomment-1663403902
                const filtered = [...originalData].filter((country: { name: string }) =>
                    country.name.toLowerCase().includes(query.toLowerCase())
                );

                const channel = (
                    window as Window & typeof globalThis & { __STORYBOOK_ADDONS_CHANNEL__: Channel }
                ).__STORYBOOK_ADDONS_CHANNEL__;

                channel.emit(UPDATE_STORY_ARGS, {
                    storyId: id,
                    updatedArgs: {
                        suggestions: filtered // This way the reference of suggestions change in runtime and primeng finish its change detection lifecycle
                    }
                });
            }
        },
        template: `<p-autoComplete
        (completeMethod)="filterCountries($event)"
        [dropdown]="dropdown"
        [suggestions]="suggestions"
        [field]="field"
        appendTo="body"
        [multiple]="multiple"
        [showClear]="showClear"
        [dropdownIcon]="dropdownIcon"
        [delay]="delay"
        [unique]="unique"
        ></p-autoComplete>`
    };
};
