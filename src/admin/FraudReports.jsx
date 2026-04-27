import { useState } from "react";

function FraudReports({ reports, onUpdate, onDelete }) {
	const [message, setMessage] = useState("");
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");

	const handleStatusChange = async (reportId, status) => {
		const current = reports.find((item) => item.id === reportId);
		if (!current) {
			setMessage("Fraud report not found.");
			return;
		}

		const result = await onUpdate(reportId, {
			title: current.title,
			category: current.category,
			description: current.description,
			location: current.location,
			status,
		});
		setMessage(result.message);
	};

	const handleDelete = async (reportId) => {
		const result = await onDelete(reportId);
		setMessage(result.message);
	};

	const filteredReports = reports
		.filter((report) => {
			if (statusFilter !== "all" && report.status !== statusFilter) {
				return false;
			}

			const safeSearch = search.trim().toLowerCase();
			if (!safeSearch) {
				return true;
			}

			const searchable = `${report.title} ${report.location} ${report.category} ${report.createdBy}`.toLowerCase();
			return searchable.includes(safeSearch);
		})
		.sort(
			(first, second) =>
				new Date(second.createdAt || 0).getTime() - new Date(first.createdAt || 0).getTime()
		);

	return (
		<section className="panel">
			<h3>Fraud report desk</h3>
			<p>Review citizen reports, update workflow status, and remove invalid entries.</p>
			{message ? <p className="muted">{message}</p> : null}

			<div className="admin-toolbar">
				<div className="admin-toolbar-group">
					<input
						type="search"
						placeholder="Search title, location, category, or reporter"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
					/>
					<select
						value={statusFilter}
						onChange={(event) => setStatusFilter(event.target.value)}
					>
						<option value="all">All statuses</option>
						<option value="submitted">Submitted</option>
						<option value="under-review">Under Review</option>
						<option value="verified">Verified</option>
						<option value="rejected">Rejected</option>
					</select>
				</div>
				<p className="admin-toolbar-note">Showing {filteredReports.length} reports</p>
			</div>

			<div className="table-wrap">
				<table>
					<thead>
						<tr>
							<th>Title</th>
							<th>Location</th>
							<th>Category</th>
							<th>Status</th>
							<th>Reporter</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{filteredReports.length ? (
							filteredReports.map((report) => (
								<tr key={report.id}>
									<td>{report.title}</td>
									<td>{report.location}</td>
									<td>{report.category}</td>
									<td>
										<select
											value={report.status}
											onChange={(event) =>
												handleStatusChange(report.id, event.target.value)
											}
										>
											<option value="submitted">Submitted</option>
											<option value="under-review">Under Review</option>
											<option value="verified">Verified</option>
											<option value="rejected">Rejected</option>
										</select>
									</td>
									<td>{report.createdBy}</td>
									<td>
										<button
											className="btn btn-danger"
											type="button"
											onClick={() => handleDelete(report.id)}
										>
											Delete
										</button>
									</td>
								</tr>
							))
						) : (
							<tr>
								<td colSpan={6} className="muted">
									No fraud reports match your filters.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</section>
	);
}

export default FraudReports;
