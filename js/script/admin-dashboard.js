/**
 * Admin Dashboard integration.
 * Dokumentasiya: GET /api/admin/dashboard
 */
$(document).ready(function ()
{
    var statsRow = $('#adminStatsRow');
    if (!statsRow.length) return;

    function escapeHtml(t) { return $('<div>').text(t == null ? '' : t).html(); }

    function card(icon, value, label)
    {
        return '<div class="col-lg-4 col-md-6">' +
            '<div class="admin-stat-card">' +
            '<div class="stat-icon"><i class="' + icon + '"></i></div>' +
            '<div class="stat-value">' + value + '</div>' +
            '<div class="stat-label">' + label + '</div>' +
            '</div></div>';
    }

    apiFetch('/admin/dashboard')
        .then(function (result)
        {
            if (!result.success || !result.data)
            {
                statsRow.html('<div class="col-12 text-center p-a30"><p class="text-muted">No dashboard data.</p></div>');
                return;
            }
            var d = result.data;
            var html = '';
            html += card('fa fa-users', d.totalUsers != null ? d.totalUsers : 0, 'Total Users');
            html += card('fa fa-briefcase', d.totalJobs != null ? d.totalJobs : 0, 'Total Jobs');
            html += card('fa fa-file-alt', d.totalApplications != null ? d.totalApplications : 0, 'Applications');
            html += card('fa fa-building', d.totalCompanies != null ? d.totalCompanies : 0, 'Companies');
            html += card('fa fa-user-plus', d.newUsersThisMonth != null ? d.newUsersThisMonth : 0, 'New Users (Month)');
            html += card('fa fa-dollar-sign', (d.revenueThisMonth != null ? d.revenueThisMonth.toFixed(2) : '0.00'), 'Revenue (Month)');
            statsRow.html(html);

            // Jobs by status
            var statusList = $('#adminJobsByStatus');
            statusList.empty();
            var jbs = d.jobsByStatus || {};
            var keys = Object.keys(jbs);
            if (!keys.length)
            {
                statusList.html('<li class="list-group-item text-muted">No data</li>');
            } else
            {
                keys.forEach(function (k)
                {
                    statusList.append('<li class="list-group-item d-flex justify-content-between" style="text-transform:capitalize;">' + escapeHtml(k) + ' <span class="badge bg-primary text-white">' + jbs[k] + '</span></li>');
                });
            }

            // Top categories
            var catList = $('#adminTopCategories');
            catList.empty();
            var cats = d.topCategories || [];
            if (!cats.length)
            {
                catList.html('<li class="list-group-item text-muted">No data</li>');
            } else
            {
                cats.forEach(function (c)
                {
                    catList.append('<li class="list-group-item d-flex justify-content-between">' + escapeHtml(c.name) + ' <span class="badge bg-primary text-white">' + (c.jobCount != null ? c.jobCount : 0) + '</span></li>');
                });
            }
        })
        .catch(function (err)
        {
            console.error('Admin dashboard error:', err);
            statsRow.html('<div class="col-12 text-center p-a30"><p class="text-danger">Failed to load dashboard data. Please try again.</p></div>');
        });
});
