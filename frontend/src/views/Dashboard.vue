<template>
	<main-content class="dashboard" :breads="breads">
		<div class="dashboard-card-box">
			<b-row>
				<b-col>
					<report-card name="Today Sales" icon="cart-plus" number="1780.00 $" />
				</b-col>
				<b-col>
					<report-card name="Income" icon="fas fa-hand-holding-usd" awesome number="2300.00 $" />
				</b-col>
				<b-col>
					<report-card name="Expenses" icon="far fa-money-bill-alt" awesome number="1888.00 $" />
				</b-col>
				<b-col>
					<report-card name="Profits" icon="fas fa-coins" awesome number="412.00 $" />
				</b-col>
			</b-row>
		</div>
		<div class="details mt-4">
			<b-row>
				<b-col cols="8">
					<div class="recent-sales shadow-sm bg-white px-3 pb-3 rounded">
						<div class="recent-header py-3 d-flex justify-content-between align-items-center">
							<h3 class="mb-0">Recent Sales</h3>
							<router-link to="/sale">
								<b-btn variant="primary">View All</b-btn>
							</router-link>
						</div>
						<table class="table table-hover mb-0">
							<thead>
								<tr>
									<th>Reference</th>
									<th>Customer</th>
									<th>Status</th>
									<th>Total Price</th>
									<th>Paid</th>
									<th>Due</th>
									<th>Payment Status</th>
								</tr>
							</thead>
							<tbody>
								<tr v-for="(sale, i) in sales" :key="i">
									<td>{{ sale.reference }}</td>
									<td>{{ sale.customer | relation }}</td>
									<td v-sale-status="sale.status"></td>
									<td>{{ sale.grand_total | floating }}</td>
									<td>{{ sale.paid | floating }}</td>
									<td>{{ sale.due | floating }}</td>
									<td v-payment-status="sale.payment_status"></td>
								</tr>
							</tbody>
						</table>
					</div>
				</b-col>
				<b-col cols="4">
					<div class="recent-customers shadow-sm bg-white px-3 pb-3 rounded">
						<div class="recent-header py-3 d-flex justify-content-between align-items-center">
							<h3 class="mb-0">Recent Customers</h3>
							<router-link to="/customer">
								<b-btn variant="primary">View All</b-btn>
							</router-link>
						</div>
						<table class="table table-hover mb-0">
							<tbody>
								<tr v-for="(customer, i) in customers" :key="i">
									<td width="60px">
										<div class="customer-img">
											<img :src="require(`@/assets/${customer.img}`)" alt="" />
										</div>
									</td>
									<td>
										<h4 class="mb-0">
											{{ customer.name }}
											<br />
											<span>{{ customer.country }}</span>
										</h4>
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</b-col>
			</b-row>
		</div>
	</main-content>
</template>
<script>
import ReportCard from "@/components/ReportCard";
export default {
	name: "Dashboard",
	components: { ReportCard },
	data() {
		return {
			breads: [{ title: "Dashboard" }],
			customers: [
				{ name: "David", country: "Italy", img: "user1.jpg" },
				{ name: "Muhammad", country: "Egypt", img: "user2.jpg" },
				{ name: "Amelia", country: "France", img: "user3.jpg" },
				{ name: "Olivia", country: "USA", img: "user4.jpg" },
				{ name: "Amit", country: "Jaban", img: "user5.jpg" }
				// { name: "Ashraf", country: "India", img: "user6.jpg" },
				// { name: "Diana", country: "Malaysia", img: "user7.jpg" },
				// { name: "Yasser", country: "Egypt", img: "user8.jpg" }
			],
			sales: [
				{
					reference: "SL_1111",
					customer: { id: 1, name: "Star Refigerator" },
					status: 0,
					grand_total: 74,
					paid: 74,
					due: 0,
					payment_status: 0
				},
				{
					reference: "SL_1112",
					customer: { id: 2, name: "Kamal Salem" },
					status: 2,
					grand_total: 1890,
					paid: 890,
					due: 1000,
					payment_status: 2
				},
				{
					reference: "SL_1113",
					customer: { id: 2, name: "Mohamed Ashraf" },
					status: 1,
					grand_total: 1595,
					paid: 0,
					due: 1595,
					payment_status: 1
				},
				{
					reference: "SL_1115",
					customer: { id: 2, name: "Walk-in-customer" },
					status: 0,
					grand_total: 2600,
					paid: 2600,
					due: 0,
					payment_status: 0
				},
				{
					reference: "SL_1114",
					customer: { id: 2, name: "Said Ali" },
					status: 2,
					grand_total: 3265,
					paid: 2000,
					due: 1265,
					payment_status: 2
				},
				{
					reference: "SL_1115",
					customer: { id: 2, name: "Asmaa Foaad" },
					status: 0,
					grand_total: 4580,
					paid: 4580,
					due: 0,
					payment_status: 0
				}
			]
		};
	}
};
</script>

<style scoped lang="scss">
.dashboard {
	.dashboard-card-box {
		position: relative;
		width: 100%;
		.dashboard-card {
			position: relative;
			background: #fff;
			padding: 20px;
			display: flex;
			justify-content: space-between;
			cursor: pointer;
			.dashboard-card-content {
				.dashboard-card-numbers {
					position: relative;
					font-size: 2em;
					font-weight: 500;
				}
				.dashboard-card-name {
					color: #999;
				}
			}
			.dashboard-card-icon {
				font-size: 2.5em;
				color: var(--primary);
			}
		}
	}
	.details {
		.recent-customers {
			position: relative;
			min-height: 395px;
			background-color: #fff;
			.customer-img {
				position: relative;
				width: 40px;
				height: 40px;
				border-radius: 50%;
				overflow: hidden;
				img {
					width: 100%;
					height: 100%;
					object-fit: cover;
				}
			}
			table {
				tr {
					&:hover,
					&:hover td h4 span {
						background: var(--primary);
						color: #fff;
					}
					td {
						padding: 10px 10px;
						h4 {
							font-size: 16px;
							font-weight: 500;
							line-height: 1.2em;
							span {
								font-size: 14px;
								color: #999;
							}
						}
					}
				}
			}
		}
		// table {
		// 	tbody tr {
		// 		&:hover,
		// 		&:hover td h4 span {
		// 			background: var(--secondary);
		// 			color: #fff;
		// 		}
		// 	}
		// }
	}
}
</style>
