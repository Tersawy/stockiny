<template>
	<b-row class="d-print-none">
		<b-col cols="12" lg="6" xl="4">
			<b-form-group class="mb-0">
				<b-input-group>
					<b-form-input :placeholder="inputSeachPlaceholder" v-model="controls.search" class="search-input" />
					<slot name="button-search-in">
						<ButtonSearchIn :searchIn="controls.searchIn" />
					</slot>
				</b-input-group>
			</b-form-group>
		</b-col>
		<b-col cols="12" lg="6" xl="8">
			<div class="d-flex justify-content-center justify-content-sm-end mt-4 mt-lg-0">
				<b-btn variant="danger" class="d-inline-flex align-items-center mr-3 mb-3" @click="$emit('btnPdfClicked')">
					<PdfIcon />
					<span class="d-none d-sm-block ml-1">PDF</span>
				</b-btn>

				<vue-excel-xlsx v-bind="excelProps" class="btn btn-success d-inline-flex align-items-center mr-3 mb-3">
					<ExcelIcon />
					<span class="d-none d-sm-block ml-1">EXCEL</span>
				</vue-excel-xlsx>
				<b-btn variant="info" class="d-inline-flex align-items-center mr-3 mb-3" @click="$emit('btnImportClicked')" v-if="!noImport">
					<CloudIcon />
					<span class="d-none d-sm-block ml-1">Import</span>
				</b-btn>
				<b-btn variant="primary" class="d-inline-flex align-items-center mb-3" @click="$emit('btnCreateClicked')">
					<PlusIcon />
					<span class="d-none d-sm-block ml-1">Create</span>
				</b-btn>
			</div>
		</b-col>
	</b-row>
</template>

<script>
import PlusIcon from "@/components/icons/plus";

import CloudIcon from "@/components/icons/cloud";

import ExcelIcon from "@/components/icons/excel";

import PdfIcon from "@/components/icons/pdf";

import VueExcelXlsx from "vue-excel-xlsx/VueExcelXlsx";

const ButtonSearchIn = () => import("@/components/ButtonSearchIn");

export default {
	components: { ButtonSearchIn, VueExcelXlsx, PlusIcon, CloudIcon, ExcelIcon, PdfIcon },

	props: {
		controls: {
			type: Object,
			default: () => ({
				search: "",
				searchIn: { name: true, reference: true }
			})
		},

		inputSeachPlaceholder: { type: String, default: "Type to search" },

		noImport: { type: Boolean, default: false },

		excelProps: {
			type: Object,
			default: () => ({
				data: [],
				columns: [],
				fileName: "locanos",
				fileType: "xlsx",
				sheetName: "sheetname"
			})
		}
	}
};
</script>
