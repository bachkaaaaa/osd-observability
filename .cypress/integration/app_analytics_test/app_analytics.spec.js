/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />
import { suppressResizeObserverIssue } from '../../utils/constants';

import {
  moveToHomePage,
  moveToCreatePage,
  moveToApplication,
  moveToEditPage,
  changeTimeTo24,
  expectMessageOnHover,
  baseQuery,
  nameOne,
  nameTwo,
  nameThree,
  description,
  service_one,
  service_two,
  trace_one,
  trace_two,
  trace_three,
  query_one,
  query_two,
  availability_default,
  visOneName,
  visTwoName,
  composition,
  newName,
  TYPING_DELAY,
  timeoutDelay,
  loadAllData,
} from '../../utils/app_constants';

suppressResizeObserverIssue(); //needs to be in file once

describe('Creating application', () => {
  before(() => {
    loadAllData();
  });

  beforeEach(() => {
    moveToCreatePage();
  });

  it('Suggests correct autocompletion', () => {
    cy.get('[data-test-subj="createPageTitle"').should('contain', 'Create application');
    cy.get('[data-test-subj="logSourceAccordion"]').trigger('mouseover').click();
    cy.get('[data-test-subj="searchAutocompleteTextArea"]').click();
    cy.get('.aa-List').find('.aa-Item').should('have.length', 1);
    cy.get('.aa-Item').contains('source').should('exist');
    cy.focused().type('{enter}');
    cy.get('.aa-List').find('.aa-Item').should('have.length', 1);
    cy.get('.aa-Item').contains('=').should('exist');
    cy.focused().type('{enter}');
    cy.focused().type('opensearch');
    cy.get('[data-test-subj="searchAutocompleteTextArea"]').click();
    cy.get('.aa-Item').contains('opensearch_dashboards_sample_data_flights').click();
    cy.focused().clear();
    cy.get('.aa-List').find('.aa-Item').should('have.length', 1);
    cy.focused().type('{enter}');
    cy.get('[data-test-subj="searchAutocompleteTextArea"]').should('contain', 'source ');
    cy.focused().type('{enter}');
    cy.get('[data-test-subj="searchAutocompleteTextArea"]').should('contain', 'source = ');
    cy.focused().type('opensearch');
    cy.get('[data-test-subj="searchAutocompleteTextArea"]').click();
    cy.get('.aa-Item').contains('opensearch_dashboards_sample_data_flights').click();
    cy.get('[data-test-subj="searchAutocompleteTextArea"]').should(
      'contain',
      'source = opensearch_dashboards_sample_data_flights '
    );
    cy.focused().type('{downArrow}');
    cy.focused().type('{enter}');
    cy.get('[data-test-subj="searchAutocompleteTextArea"]').should(
      'contain',
      'source = opensearch_dashboards_sample_data_flights, '
    );
    cy.focused().type('opensearch');
    cy.get('[data-test-subj="searchAutocompleteTextArea"]').click();
    cy.get('.aa-Item').contains('opensearch_dashboards_sample_data_logs').click();
    cy.get('[data-test-subj="searchAutocompleteTextArea"]').should(
      'contain',
      'source = opensearch_dashboards_sample_data_flights,opensearch_dashboards_sample_data_logs '
    );
  });

  it('Creates an application and redirects to application', () => {
    expectMessageOnHover('createButton', 'Name is required.');
    cy.get('[data-test-subj="nameFormRow"]').type(nameOne);
    cy.get('[data-test-subj="descriptionFormRow"]').type('This application is for testing.');
    expectMessageOnHover(
      'createButton',
      'Provide at least one log source, service, entity or trace group.'
    );
    cy.get('[data-test-subj="servicesEntitiesAccordion"]').trigger('mouseover').click();
    cy.get('[data-test-subj="servicesEntitiesComboBox"]').click();
    cy.focused().type('{downArrow}');
    cy.focused().type('{enter}');
    cy.get('[data-test-subj="servicesEntitiesCountBadge"]').should('contain', '1');
    cy.get('[data-test-subj="logSourceAccordion"]').trigger('mouseover').click();
    cy.get('[data-test-subj="createButton"]').should('not.be.disabled');
    cy.get('[data-test-subj="createAndSetButton"]').should('be.disabled');
    expectMessageOnHover('createAndSetButton', 'Log source is required to set availability.');
    cy.get('[data-test-subj="searchAutocompleteTextArea"]')
      .click()
      .type('      ' + baseQuery);
    cy.get('[data-test-subj="traceGroupsAccordion"]').trigger('mouseover').click();
    cy.get('[data-test-subj="traceGroupsComboBox"]').scrollIntoView().type('http');
    cy.get('.euiFilterSelectItem').contains(trace_one).trigger('mouseover').click();
    cy.get('.euiFilterSelectItem').contains(trace_two).trigger('mouseover').click();
    cy.get('[data-test-subj="traceGroupsCountBadge"]').should('contain', '2');
    cy.get('[data-test-subj="createButton"]').should('not.be.disabled');
    cy.get('[data-test-subj="createButton"]').click();
    cy.get('.euiTableRow').should('have.length.lessThan', 2);
    cy.get('[data-test-subj="applicationTitle"]').should('contain', nameOne);
    cy.get('[data-test-subj="app-analytics-panelTab"]').click();
    cy.get('[data-test-subj="addFirstVisualizationText"]').should('exist');
  });

  it('Redirects to home page on cancel', () => {
    cy.get('[data-test-subj="cancelCreateButton"]').contains('Cancel').click();
    cy.get('[data-test-subj="applicationHomePageTitle"]').should('exist');
  });

  it('Saves current input on reload', () => {
    cy.get('[data-test-subj="nameFormRow"]').type(nameOne);
    cy.get('[data-test-subj="descriptionFormRow"]').type(description);
    cy.get('[data-test-subj="logSourceAccordion"]').trigger('mouseover').click();
    cy.get('[data-test-subj="searchAutocompleteTextArea"]').click();
    cy.get('[data-test-subj="searchAutocompleteTextArea"]')
      .click()
      .type('      ' + baseQuery);
    cy.get('[data-test-subj="servicesEntitiesAccordion"]').trigger('mouseover').click();
    cy.get('[data-test-subj="servicesEntitiesComboBox"]').scrollIntoView();
    cy.get('[data-test-subj="servicesEntitiesComboBox"]').trigger('mouseover').click();
    cy.get('.euiFilterSelectItem').contains(service_one).trigger('click');
    cy.get('[data-test-subj="servicesEntitiesCountBadge"]').should('contain', '1');
    cy.get('[data-test-subj="traceGroupsAccordion"]').trigger('mouseover').click();
    cy.get('[data-test-subj="traceGroupsComboBox"]').scrollIntoView().type('http');
    cy.get('.euiFilterSelectItem').contains(trace_one).trigger('click');
    cy.get('.euiFilterSelectItem').contains(trace_two).trigger('click');
    cy.get('[data-test-subj="traceGroupsCountBadge"]').should('contain', '2');
    cy.reload();
    cy.get('[data-test-subj="nameFormRow"]').find('.euiFieldText').should('contain.value', nameOne);
    cy.get('[data-test-subj="descriptionFormRow"]')
      .find('.euiFieldText')
      .should('contain.value', description);
    cy.get('[data-test-subj="logSourceAccordion"]').trigger('mouseover').click();
    cy.get('[data-test-subj="searchAutocompleteTextArea"]').should('contain.value', baseQuery);
    cy.get('[data-test-subj="servicesEntitiesCountBadge"]').should('contain', '1');
    cy.get('[data-test-subj="traceGroupsCountBadge"]').should('contain', '2');
  });

  it('Shows clear modals before clearing', () => {
    cy.get('[data-test-subj="logSourceAccordion"]').trigger('mouseover').click();
    cy.get('[data-test-subj="clearLogSourceButton"]').should('be.disabled');
    cy.get('[data-test-subj="searchAutocompleteTextArea"]')
      .click()
      .type('      ' + baseQuery);
    cy.get('[data-test-subj="clearLogSourceButton"]').click();
    cy.get('.euiButton--danger').contains('Clear').click();
    cy.get('[data-test-subj="searchAutocompleteTextArea"]').should('contain.value', '');
    cy.get('[data-test-subj="servicesEntitiesAccordion"]').trigger('mouseover').click();
    cy.get('[data-test-subj="servicesEntitiesComboBox"]').trigger('mouseover').click();
    cy.get('.euiFilterSelectItem').contains(service_one).trigger('click');
    cy.get('[data-test-subj="servicesEntitiesCountBadge"]').should('contain', '1');
    cy.get('[data-test-subj="clearServicesEntitiesButton"]').click();
    cy.get('.euiButton--danger').contains('Clear all').click();
    cy.get('[data-test-subj="servicesEntitiesCountBadge"]').should('contain', '0');
    cy.get('[data-test-subj="servicesEntitiesAccordion"]').trigger('mouseover').click();
    cy.get('[data-test-subj="traceGroupsAccordion"]').trigger('mouseover').click();
    cy.get('[data-test-subj="traceGroupsComboBox"]').scrollIntoView().type('http');
    cy.get('.euiFilterSelectItem').contains(trace_one).trigger('click');
    cy.get('.euiFilterSelectItem').contains(trace_two).trigger('click');
    cy.get('[data-test-subj="traceGroupsCountBadge"]').should('contain', '2');
    cy.get('[data-test-subj="clearTraceGroupsButton"]').click();
    cy.get('.euiButton--danger').contains('Clear all').click();
    cy.get('[data-test-subj="traceGroupsCountBadge"]').should('contain', '0');
  });

  it('Saves time range for each application', () => {
    cy.get('[data-test-subj="nameFormRow"]').type(nameTwo);
    cy.get('[data-test-subj="logSourceAccordion"]').trigger('mouseover').click();
    cy.get('[data-test-subj="searchAutocompleteTextArea"]')
      .click()
      .type('      ' + baseQuery);
    cy.get('[data-test-subj="createButton"]').should('not.be.disabled');
    cy.get('[data-test-subj="createButton"]').click();
    cy.get('.euiTableRow').should('have.length.lessThan', 1);
    cy.get('[data-test-subj="applicationTitle"]').should('contain', nameTwo);
    changeTimeTo24('weeks');
    cy.get('[data-test-subj="superDatePickerShowDatesButton"]').should('contain', 'Last 24 weeks');
    cy.get('.euiBreadcrumb[href="#/"]').click();
    cy.get('.euiTableRow').should('have.length.greaterThan', 1);
    cy.get(`[data-test-subj="${nameOne}ApplicationLink"]`).click();
    cy.get('.euiTableRow').should('have.length.lessThan', 1);
    cy.get('[data-test-subj="applicationTitle"]').should('contain', nameOne);
    changeTimeTo24('months');
    cy.get('[data-test-subj="superDatePickerShowDatesButton"]').should('contain', 'Last 24 months');
    cy.get('.euiBreadcrumb[href="#/"]').click();
    cy.get('.euiTableRow').should('have.length.greaterThan', 1);
    cy.get(`[data-test-subj="${nameTwo}ApplicationLink"]`).click();
    cy.get('.euiTableRow').should('have.length.lessThan', 1);
    cy.get('[data-test-subj="applicationTitle"]').should('contain', nameTwo);
    cy.get('[data-test-subj="superDatePickerShowDatesButton"]').should('contain', 'Last 24 weeks');
    cy.visit(`${Cypress.env('opensearchDashboards')}/app/observability-applications#/`);
    cy.get(`[data-test-subj="${nameOne}ApplicationLink"]`).click();
    cy.get('[data-test-subj="applicationTitle"]').should('contain', nameOne);
    cy.get('[data-test-subj="superDatePickerShowDatesButton"]').should('contain', 'Last 24 months');
  });
});

describe('Setting availability', () => {
  it('Redirects to set availability at three entry points', () => {
    moveToCreatePage();
    cy.get('[data-test-subj="nameFormRow"]').type(nameThree);
    cy.get('[data-test-subj="logSourceAccordion"]').trigger('mouseover').click();
    cy.get('[data-test-subj="searchAutocompleteTextArea"]').click();
    cy.focused().type('       source = ');
    cy.focused().type('{enter}');
    cy.get('[data-test-subj="createAndSetButton"]').click({ force: true });
    cy.get('.euiTableRow').should('have.length.lessThan', 1);
    cy.get('[data-test-subj="applicationTitle"]').should('contain', nameThree);
    cy.get('.euiBreadcrumb[href="#/"]').click();
    cy.reload();
    cy.get(`[data-test-subj="${nameThree}ApplicationLink"]`);
    cy.get('[data-test-subj="setAvailabilityHomePageLink"]').first().click();
    cy.get('[data-test-subj="applicationTitle"]').should('contain', nameThree);
    cy.get('.euiTab-isSelected[id="app-analytics-log"]').should('exist', { timeout: timeoutDelay });
    cy.get('[data-test-subj="searchAutocompleteTextArea"]').should(
      'contain.value',
      availability_default
    );
    cy.get('[id="explorerPlotComponent"]').should('exist');
    cy.get('.euiTab-isSelected[id="availability-panel"]').should('exist');
    cy.get('.euiBreadcrumb[href="#/"]').click();
    cy.get(`[data-test-subj="${nameThree}ApplicationLink"]`).click();
    cy.get('[data-test-subj="applicationTitle"]').should('contain', nameThree);
    cy.get('[data-test-subj="app-analytics-configTab"]').click();
    cy.get('[data-test-subj="setAvailabilityConfigLink"]').click();
    cy.get('.euiTab-isSelected[id="app-analytics-log"]').should('exist', { timeout: timeoutDelay });
    cy.get('[data-test-subj="searchAutocompleteTextArea"]').should(
      'contain.value',
      availability_default
    );
    cy.get('[id="explorerPlotComponent"]').should('exist');
    cy.get('.euiTab-isSelected[id="availability-panel"]').should('exist');
  });
});

describe('Viewing application', () => {
  beforeEach(() => {
    moveToApplication(nameOne);
  });

  it('Has working breadcrumbs', () => {
    cy.get('.euiBreadcrumb').contains(nameOne).click();
    cy.get('[data-test-subj="applicationTitle"]').should('contain', nameOne);
    cy.get('.euiBreadcrumb[href="#/"]').click();
    cy.get('[data-test-subj="applicationHomePageTitle"]').should('contain', 'Applications');
    cy.get('.euiBreadcrumb[href="observability-logs#/"]').click();
    cy.get('[data-test-subj="eventHomePageTitle"]').should('contain', 'Logs');
  });

  it('Shares time range among tabs', () => {
    changeTimeTo24('months');
    cy.get('[data-test-subj="superDatePickerShowDatesButton"]').should('contain', 'Last 24 months');
    cy.get('[data-test-subj="app-analytics-serviceTab"]').click();
    cy.get('[data-test-subj="superDatePickerShowDatesButton"]').should('contain', 'Last 24 months');
    cy.get('[data-test-subj="app-analytics-traceTab"]').click();
    cy.get('[data-test-subj="superDatePickerShowDatesButton"]').should('contain', 'Last 24 months');
    cy.get('[data-test-subj="app-analytics-logTab"]').click();
    cy.get('[data-test-subj="superDatePickerShowDatesButton"]').should('contain', 'Last 24 months');
    cy.get('[data-test-subj="app-analytics-panelTab"]').click();
    cy.get('[data-test-subj="superDatePickerShowDatesButton"]').should('contain', 'Last 24 months');
  });

  it('Shows latency variance in dashboards table', () => {
    changeTimeTo24('years');
    cy.get('[data-test-subj="app-analytics-traceTab"]').click();
    cy.get('[data-test-subj="trace-groups-service-operation-accordian"]').click();
    cy.get('[data-test-subj="dashboardTable"]')
      .first()
      .within(($table) => {
        cy.get('.plot-container').should('have.length.at.least', 1);
      });
  });

  it('Adds filter when Trace group name is clicked', () => {
    cy.get('[data-test-subj="app-analytics-traceTab"]').click();
    cy.get('[data-test-subj="trace-groups-service-operation-accordian"]').click();
    cy.get('[data-test-subj="dashboard-table-trace-group-name-button"]')
      .contains('client_create_order')
      .click();
    cy.get('[data-test-subj="client_create_orderFilterBadge"]').should('exist');
    cy.get('[data-test-subj="filterBadge"]').eq(0).click();
    cy.get('[data-test-subj="deleteFilterIcon"]').click();
    cy.get('[data-test-subj="client_create_orderFilterBadge"]').should('not.exist');
  });

  it('Opens service detail flyout when Service Name is clicked', () => {
    cy.get('[data-test-subj="app-analytics-serviceTab"]').click();
    cy.get('*[data-test-subj^="service-link"]').eq(0).click();
    cy.get('[data-test-subj="serviceDetailFlyoutTitle"]').should('be.visible');
    cy.get('[data-test-subj="Number of connected servicesDescriptionList"]').should('contain', '3');
    cy.get('[data-text="Errors"]').eq(1).click(); // Selecting errors tab within flyout
    cy.get('.ytitle').contains('Error rate').should('exist');
    cy.get('[data-test-subj="dataGridRowCell"]').eq(0).click({ force: true }); // absolutely doesn't click no matter what unless theres a double click
    cy.get('button[data-test-subj="spanId-link"]').eq(0).click({ force: true });
    cy.get('[data-test-subj="spanDetailFlyout"]').contains('Span detail').should('be.visible');
    cy.get('[data-test-subj="ServiceDescriptionList"]').should('contain', 'authentication');
    cy.get('[data-test-subj="euiFlyoutCloseButton"]').click();
    cy.get('[data-test-subj="serviceDetailFlyout"]').should('not.exist');
    cy.get('[data-test-subj="spanDetailFlyout"]').should('not.exist');
  });

  it('Opens trace detail flyout when Trace ID is clicked', () => {
    cy.get('[data-test-subj="app-analytics-traceTab"]').click();
    cy.get('[title="03f9c770db5ee2f1caac0afc36db49ba"]').click();
    cy.get('[data-test-subj="traceDetailFlyoutTitle"]').should('be.visible');
    cy.get('[data-test-subj="traceDetailFlyout"]').within(($flyout) => {
      cy.get('[data-test-subj="LatencyDescriptionList"]').should('contain', '224.99');
    });
    cy.get('[data-test-subj="euiFlyoutCloseButton"]').click();
    cy.get('[data-test-subj="traceDetailFlyout"]').should('not.exist');
    cy.get('[data-test-subj="superDatePickerShowDatesButton"]').click(); //added to replace wait
    cy.get('[title="03f9c770db5ee2f1caac0afc36db49ba"]').click();
    cy.get('.panel-title-count').contains('(11)').should('exist');
    cy.get('[data-text="Span list"]').click();
    cy.get('[data-test-subj="dataGridRowCell"]').contains('d67c5bb617ba9203').should('exist');
    cy.get('[data-test-subj="dataGridRowCell"]').contains('d67c5bb617ba9203').click();
    cy.get('[data-test-subj="spanDetailFlyout"]').should('be.visible');
    cy.get('[data-test-subj="euiFlyoutCloseButton"]').click();
    cy.get('[data-test-subj="spanDetailFlyout"]').should('not.exist');
  });

  it('Opens span detail flyout when Span ID is clicked', () => {
    cy.get('[data-test-subj="app-analytics-traceTab"]').click();
    cy.get('input[type="search"]').click().type(`5ff3516909562c60`);
    cy.get('[data-test-subj="dataGridRowCell"]').contains('5ff3516909562c60').click();
    cy.get('[data-test-subj="spanDetailFlyout"]').should('be.visible');
    cy.get('[data-test-subj="spanDetailFlyout"]').within(($flyout) => {
      cy.get('[data-test-subj="OperationDescriptionList"]').should('contain', 'HTTP GET');
    });
    cy.get('.euiText').contains('order').click();
    cy.get('[aria-label="span-flyout-filter-icon"]').click();
    cy.focused().blur();
    cy.get('[data-test-subj="euiFlyoutCloseButton"]').click();
    cy.get('[data-test-subj="filterBadge"][title="serviceName: order"]').should('exist');
    cy.get('[aria-label="Remove filter"]').click();
    cy.get('[data-test-subj="filterBadge"][title="serviceName: order"]').should('not.exist');
  });

  it('Shows base query', () => {
    cy.get('[data-test-subj="app-analytics-logTab"]').click();
    cy.get('.euiBadge[title="Base Query"]').should('exist');
    cy.get('.euiBadge[title="Base Query"]').trigger('mouseover');
    cy.get('.euiToolTipPopover')
      .contains('source = opensearch_dashboards_sample_data_flights')
      .should('exist');
  });

  it('Saves visualization #1 to panel', () => {
    cy.get('[data-test-subj="app-analytics-panelTab"]').click();
    cy.get('[data-test-subj="addVisualizationButton"]').first().click();
    cy.get('[data-test-subj="superDatePickerApplyTimeButton"]').click();
    cy.get('[id="explorerPlotComponent"]').should('exist');
    cy.get('[data-test-subj="searchAutocompleteTextArea"]').click();
    cy.get('.aa-List').find('.aa-Item').should('have.length', 11);
    cy.get('[data-test-subj="searchAutocompleteTextArea"]').focus();
    cy.get('[data-test-subj="searchAutocompleteTextArea"]').type('      ' + query_one, {
      delay: TYPING_DELAY,
    });
    changeTimeTo24('months');
    cy.get('[data-test-subj="main-content-visTab"]').click();
    cy.get('[data-test-subj="eventExplorer__saveManagementPopover"]').click();
    cy.get('[data-test-subj="eventExplorer__querySaveName"]').click().type(visOneName);
    cy.get('[data-test-subj="eventExplorer__querySaveConfirm"]').click();
    cy.get('.euiToast').contains(`Saved successfully`);
    cy.get('[data-test-subj="app-analytics-panelTab"]').click();
    cy.get('[data-test-subj="Flights to VeniceVisualizationPanel"]').should('exist');
    cy.get('[id="explorerPlotComponent"]').should('exist');
    cy.get('[class="trace bars"]').should('exist');
  });

  it('Adds availability level to visualization #1', () => {
    cy.get('[data-test-subj="app-analytics-panelTab"]').click();
    cy.get('[aria-label="actionMenuButton"]').click();
    cy.get('[data-test-subj="editVizContextMenuItem"]').click();
    changeTimeTo24('months'); //Ensure time is set
    cy.get('[data-test-subj="superDatePickerShowDatesButton"]').should('contain', 'Last 24 months');
    cy.get('[data-test-subj="superDatePickerApplyTimeButton"]').click();
    cy.get('.euiTab[id="availability-panel"]').click();

    cy.get('[data-test-subj="comboBoxInput"]').click();
    cy.get('[data-test-subj="comboBoxOptionsList "] button span')
      .contains('Time series')
      .click({ force: true });
    cy.focused().type('{enter}');

    cy.get('[data-test-subj="addAvailabilityButton"]').click();
    cy.get('[data-test-subj="euiColorPickerAnchor"]').click();
    cy.get('[aria-label="Select #54B399 as the color"]').click();
    cy.get('[data-test-subj="nameFieldText"]').click().type('Available');
    cy.get('option').contains('≥').should('exist');
    cy.get('option').contains('≤').should('exist');
    cy.get('option').contains('>').should('exist');
    cy.get('option').contains('<').should('exist');
    cy.get('option').contains('=').should('exist');
    cy.get('option').contains('≠').should('exist');
    cy.get('[data-test-subj="expressionSelect"]').select('>');
    cy.get('[data-test-subj="valueFieldNumber"]').clear().type('0.5');
    cy.get('[data-test-subj="visualizeEditorRenderButton"]').click();
    cy.get('[data-test-subj="eventExplorer__saveManagementPopover"]').click();
    cy.get('[data-test-subj="eventExplorer__querySaveConfirm"]').click();
    cy.get('[data-test-subj="app-analytics-panelTab"]').click();
    cy.get('[id="explorerPlotComponent"]').should('exist');
    cy.get('[class="lines"]').should('exist');
    cy.get('.textpoint').contains('Available').should('exist');
    cy.get('.euiBreadcrumb[href="#/"]').click();
    cy.get('[data-test-subj="AvailableAvailabilityBadge"]').should('contain', 'Available');
    cy.get(
      '[data-test-subj="AvailableAvailabilityBadge"][style="background-color: rgb(84, 179, 153); color: rgb(0, 0, 0);"]'
    ).should('exist');
  });

  it('Saves visualization #2 to panel with availability level', () => {
    changeTimeTo24('months');
    cy.get('[data-test-subj="app-analytics-logTab"]').click();
    cy.get('[data-test-subj="superDatePickerApplyTimeButton"]').click();
    cy.get('[id="explorerPlotComponent"]', { timeout: timeoutDelay }).should('exist');
    cy.get('[data-test-subj="searchAutocompleteTextArea"]').focus();
    cy.get('[data-test-subj="searchAutocompleteTextArea"]').type('      ' + query_two, {
      delay: TYPING_DELAY,
    });
    cy.get('[data-test-subj="superDatePickerApplyTimeButton"]').click();
    cy.get('[data-test-subj="main-content-visTab"]').click();
    cy.get('.euiTab[id="availability-panel"]').click();
    cy.get('[data-test-subj="comboBoxInput"]').click();
    cy.get('[data-test-subj="comboBoxOptionsList "] button span')
      .contains('Time series')
      .click({ force: true });
    cy.get('[data-test-subj="addAvailabilityButton"]').click();
    cy.get('[data-test-subj="euiColorPickerAnchor"]').click();
    cy.get('[aria-label="Select #9170B8 as the color"]').click();
    cy.get('[data-test-subj="nameFieldText"]').click().type('Super');
    cy.get('[data-test-subj="expressionSelect"]').select('<');
    cy.get('[data-test-subj="valueFieldNumber"]').clear().type('5.5');
    cy.get('[data-test-subj="visualizeEditorRenderButton"]').click();
    cy.get('[data-test-subj="addAvailabilityButton"]').click();
    cy.get('[data-test-subj="euiColorPickerAnchor"]').first().click();
    cy.get('[aria-label="Select #CA8EAE as the color"]').click();
    cy.get('[data-test-subj="nameFieldText"]').first().click().type('Cool');
    cy.get('[data-test-subj="expressionSelect"]').first().select('>');
    cy.get('[data-test-subj="valueFieldNumber"]').first().clear().type('0');
    cy.get('[data-test-subj="visualizeEditorRenderButton"]').click();
    cy.get('[data-test-subj="eventExplorer__saveManagementPopover"]').click();
    cy.get('[data-test-subj="eventExplorer__querySaveName"]').click().type(visTwoName);
    cy.get('[data-test-subj="eventExplorer__querySaveConfirm"]').click();
    cy.get('.euiToast').contains(`Saved successfully`);
    cy.get('[data-test-subj="app-analytics-panelTab"]').click();
    cy.get('[id="explorerPlotComponent"]').should('have.length', 2);
    moveToHomePage();
    cy.get(
      '[data-test-subj="SuperAvailabilityBadge"][style="background-color: rgb(145, 112, 184); color: rgb(0, 0, 0);"]'
    ).should('contain', 'Super');
  });

  it('Configuration tab shows details', () => {
    cy.get('[data-test-subj="app-analytics-configTab"]').click();
    cy.get('[data-test-subj="configBaseQueryCode"]').should('contain', baseQuery);
    cy.get('[aria-label="List of services and entities"]').find('li').should('have.length', 1);
    cy.get('[aria-label="List of trace groups"]').find('li').should('have.length', 2);
    cy.get('option').should('have.length', 2);
  });

  it('Changes availability visualization', () => {
    cy.intercept('PUT', `**/api/observability/application`).as('selectUpdate');
    cy.intercept('GET', `**/api/observability/operational_panels/panels/**`).as('loadingPanels');
    cy.get('[data-test-subj="app-analytics-configTab"]').click();
    cy.get('select').select(visOneName);
    cy.wait('@selectUpdate');

    moveToHomePage();
    cy.wait('@loadingPanels');
    cy.reload();
    cy.get(
      '[data-test-subj="AvailableAvailabilityBadge"][style="background-color: rgb(84, 179, 153); color: rgb(0, 0, 0);"]'
    ).should('contain', 'Available');
    moveToApplication(nameOne);
    cy.get('[data-test-subj="app-analytics-configTab"]').click();
    cy.get('select').find('option:selected').should('have.text', visOneName);
  });
});

describe('Separate from other plugins', () => {
  it('Hides application visualizations in Event Analytics', () => {
    cy.visit(
      `${Cypress.env('opensearchDashboards')}/app/observability-dashboards#/event_analytics`
    );
    // When there are saved queries or visualizations there are two buttons
    cy.get('body').then(($body) => {
      if ($body.find('.euiButton').length == 2) {
        cy.get('input.euiFieldSearch').type(visOneName, { delay: TYPING_DELAY });

        cy.get('.euiTableCellContent__text').contains('No items found').should('exist');
        cy.get('input.euiFieldSearch').clear().type(visTwoName, { delay: TYPING_DELAY });

        cy.get('.euiTableCellContent__text').contains('No items found').should('exist');
        cy.get('[class="euiFormControlLayoutClearButton"]').click();

        cy.get('[data-test-subj="tablePaginationPopoverButton"]').click();
        cy.get('.euiContextMenuItem__text').contains('50 rows').click();
        cy.get('.euiCheckbox__input[data-test-subj="checkboxSelectAll"]').click();

        cy.get('[data-test-subj="eventHomeAction"]').click();

        cy.get('[data-test-subj="eventHomeAction__delete"]').click();

        cy.get('[data-test-subj="popoverModal__deleteButton"]').should('be.disabled');
        cy.get('[data-test-subj="popoverModal__deleteTextInput"]').type('delete');
        cy.get('[data-test-subj="popoverModal__deleteButton"]').should('not.be.disabled');
        cy.get('[data-test-subj="popoverModal__deleteButton"]').click();
      }
    });
  });

  it('Hides application visualizations in Operational Panels', () => {
    cy.visit(`${Cypress.env('opensearchDashboards')}/app/observability-dashboards#/`);
    cy.get('.euiButtonContent').contains('Add samples').click();
    cy.get('[data-test-subj="confirmModalConfirmButton"]', { timeout: timeoutDelay }).click();
    cy.get('.euiLink').contains('[Logs] Web traffic Panel').first().click();
    cy.get('[data-test-subj="addVisualizationButton"]').click();
    cy.get('.euiContextMenuItem__text').contains('Select existing visualization').click();
    cy.get('option').contains(visOneName).should('not.exist');
    cy.get('option').contains(visTwoName).should('not.exist');
  });

  it('Hides application panels in Operational Panels', () => {
    cy.visit(`${Cypress.env('opensearchDashboards')}/app/observability-dashboards#/`);
    cy.get('[data-test-subj="operationalPanelSearchBar"]', {
      timeout: timeoutDelay,
    }).type(`${nameOne}'s Panel`, { delay: TYPING_DELAY });
    cy.get('.euiTableCellContent__text').contains('No items found').should('exist');
    cy.get('.euiFormControlLayoutClearButton').click();
    cy.get('[data-test-subj="operationalPanelSearchBar"]').type('[Logs] Web traffic Panel', {
      delay: TYPING_DELAY,
    });
    cy.get('.euiTableRow')
      .first()
      .within(($row) => {
        cy.get('.euiCheckbox').click();
      });
    cy.get('[data-test-subj="operationalPanelsActionsButton"]', { timeout: timeoutDelay }).click();
    cy.get('[data-test-subj="deleteContextMenuItem"]', { timeout: timeoutDelay }).click();
    cy.get('[data-test-subj="popoverModal__deleteTextInput"]', { timeout: timeoutDelay }).type(
      'delete'
    );
    cy.get('[data-test-subj="popoverModal__deleteButton"]', { timeout: timeoutDelay }).should(
      'not.be.disabled'
    );
    cy.get('[data-test-subj="popoverModal__deleteButton"]', { timeout: timeoutDelay }).click();
  });
});

describe('Editing application', () => {
  beforeEach(() => {
    moveToEditPage();
  });

  it('Redirects to application after saving changes', () => {
    cy.get('[data-test-subj="logSourceAccordion"]').trigger('mouseover').click();
    cy.get('[data-test-subj="searchAutocompleteTextArea"]').should('be.disabled');
    cy.get('[data-test-subj="servicesEntitiesAccordion"]').trigger('mouseover').click();
    cy.get('[data-test-subj="servicesEntitiesCountBadge"]').should('contain', '1');
    cy.get('[data-test-subj="servicesEntitiesComboBox"]').click();
    cy.get('.euiFilterSelectItem').contains(service_two).click();
    cy.get('[data-test-subj="servicesEntitiesCountBadge"]').should('contain', '2');
    cy.get('[data-test-subj="traceGroupsAccordion"]').trigger('mouseover').click();
    cy.get('[data-test-subj="traceGroupsCountBadge"]').should('contain', '2');
    cy.get('[data-test-subj="comboBoxToggleListButton"]').eq(1).click();
    cy.get('.euiFilterSelectItem').contains(trace_three).trigger('click');
    cy.get('[data-test-subj="traceGroupsCountBadge"]').should('contain', '3');
    cy.get('[data-test-subj="traceGroupsAccordion"]').trigger('mouseover').click();
    cy.get('[data-test-subj="createButton"]').click();
    cy.get('[data-test-subj="app-analytics-configTab"]').click();
    cy.get('[data-test-subj="configBaseQueryCode"]').should('contain', baseQuery);
    cy.get('[aria-label="List of services and entities"]').find('li').should('have.length', 2);
    cy.get('[aria-label="List of trace groups"]').find('li').should('have.length', 3);
    cy.get('[data-test-subj="applicationTitle"]').should('contain', nameOne);
  });
});

describe('Application Analytics home page', () => {
  beforeEach(() => {
    moveToHomePage();
  });

  it('Show correct information in table', () => {
    cy.get(`[data-test-subj="${nameOne}ApplicationLink"]`).should('exist');
    cy.get('[data-test-subj="appAnalytics__compositionColumn"]').should('contain', composition);
    cy.get(
      '[data-test-subj="AvailableAvailabilityBadge"][style="background-color: rgb(84, 179, 153); color: rgb(0, 0, 0);"]'
    ).should('contain', 'Available');
  });

  it('Renames application', () => {
    cy.get('[data-test-subj="renameApplication"]').eq(0).click();
    cy.get('input[type="text"]').clear().click().type(newName);
    cy.get('.euiButton__text').contains('Rename').click();
    cy.get('.euiToast').contains(`Application successfully renamed to "${newName}"`);
    cy.get('.euiTableRow')
      .first()
      .within(($row) => {
        cy.get('.euiLink').contains(newName).should('exist');
      });
  });

  it('Deletes application', () => {
    cy.get('.euiFieldSearch').clear().type(nameTwo);
    cy.get('[data-test-subj="deleteApplication"]').click();
    cy.get('[data-test-subj="popoverModal__deleteTextInput"]').type('delete');
    cy.get('[data-test-subj="popoverModal__deleteButton"').click();
    cy.get('.euiToast').contains(`Applications successfully deleted!`);
    cy.get('.euiFieldSearch').clear().type(nameThree);
    cy.get('[data-test-subj="deleteApplication"]').click();
    cy.get('[data-test-subj="popoverModal__deleteTextInput"]').type('delete');
    cy.get('[data-test-subj="popoverModal__deleteButton"').click();
    cy.get('.euiFieldSearch').clear().type(newName);
    cy.get('[data-test-subj="deleteApplication"]').click();
    cy.get('[data-test-subj="popoverModal__deleteTextInput"]').type('delete');
    cy.get('[data-test-subj="popoverModal__deleteButton"').click();
    cy.get('.euiFieldSearch').clear();
    cy.get('[data-test-subj="applicationHomePageTitle"]').contains('(0)');
  });
});
