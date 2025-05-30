/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiSmallButton,
  EuiInMemoryTable,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiTableFieldDataColumnType,
} from '@elastic/eui';
import producer from 'immer';
import _ from 'lodash';
import React, { useState } from 'react';
import {
  CreateAccelerationForm,
  DataTableFieldsType,
  SkippingIndexRowType,
} from '../../../../../../../../../common/types/data_connections';
import { validateSkippingIndexData } from '../../create/utils';

interface AddFieldsModalProps {
  setIsAddModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  accelerationFormData: CreateAccelerationForm;
  setAccelerationFormData: React.Dispatch<React.SetStateAction<CreateAccelerationForm>>;
}

export const AddFieldsModal = ({
  setIsAddModalVisible,
  accelerationFormData,
  setAccelerationFormData,
}: AddFieldsModalProps) => {
  const [selectedFields, setSelectedFields] = useState<DataTableFieldsType[]>([]);

  const tableColumns: Array<EuiTableFieldDataColumnType<DataTableFieldsType>> = [
    {
      field: 'fieldName',
      name: 'Field name',
      sortable: true,
      truncateText: true,
    },
    {
      field: 'dataType',
      name: 'Datatype',
      sortable: true,
      truncateText: true,
    },
  ];

  const pagination = {
    initialPageSize: 20,
    pageSizeOptions: [10, 20, 50],
  };

  return (
    <EuiModal onClose={() => setIsAddModalVisible(false)}>
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          <h1>Add fields</h1>
        </EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>
        <EuiInMemoryTable
          items={_.differenceBy(
            accelerationFormData.dataTableFields,
            accelerationFormData.skippingIndexQueryData,
            'id'
          )}
          itemId="id"
          columns={tableColumns}
          search={true}
          pagination={pagination}
          sorting={true}
          isSelectable={true}
          selection={{
            onSelectionChange: (items) => setSelectedFields(items),
          }}
        />
      </EuiModalBody>

      <EuiModalFooter>
        <EuiSmallButton onClick={() => setIsAddModalVisible(false)}>Cancel</EuiSmallButton>
        <EuiSmallButton
          onClick={() => {
            setAccelerationFormData(
              producer((accData) => {
                accData.skippingIndexQueryData.push(
                  ...selectedFields.map((x) => {
                    return { ...x, accelerationMethod: 'PARTITION' } as SkippingIndexRowType;
                  })
                );
                accData.formErrors.skippingIndexError = validateSkippingIndexData(
                  accData.accelerationIndexType,
                  accData.skippingIndexQueryData
                );
              })
            );
            setIsAddModalVisible(false);
          }}
          fill
        >
          Add
        </EuiSmallButton>
      </EuiModalFooter>
    </EuiModal>
  );
};
