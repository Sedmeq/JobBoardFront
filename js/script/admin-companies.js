/**
 * Admin — Manage Companies.
 * Dokumentasiya: GET /api/admin/companies?page=&pageSize=
 */
$(document).ready(function ()
{
    var body = $('#adminCompaniesBody');
    if (!body.length) return;

    var pagination = $('#adminCompaniesPagination');
    var currentPage = 1;
    var pageSize = 10;

    function escapeHtml(t) { return $('<div>').text(t == null ? '' : t).html(); }

    function fetchCompanies(page)
    {
        currentPage = page || 1;
        body.html('<tr><td colspan="6" class="text-center p-a30"><i class="fa fa-spinner fa-spin fa-2x text-primary"></i></td></tr>');
        pagination.empty();

        apiFetch('/admin/companies?page=' + currentPage + '&pageSize=' + pageSize)
            .then(function (result)
            {
                body.empty();
                if (!result.success || !result.data || !result.data.items || !result.data.items.length)
                {
                    body.html('<tr><td colspan="6" class="text-center p-a30"><h5>No companies found</h5></td></tr>');
                    return;
                }
                result.data.items.forEach(function (c)
                {
                    var verified = c.isVerified
                        ? '<span class="text-success" style="font-weight:600;"><i class="fa fa-check-circle"></i> Verified</span>'
                        : '<span class="text-muted">Not verified</span>';
                    body.append(
                        '<tr>' +
                        '<td class="text-primary">#' + c.id + '</td>' +
                        '<td><a href="company-profile.html?id=' + c.id + '">' + escapeHtml(c.name || '-') + '</a></td>' +
                        '<td>' + escapeHtml(c.industry || '-') + '</td>' +
                        '<td>' + escapeHtml(c.location || '-') + '</td>' +
                        '<td>' + (c.jobsCount != null ? c.jobsCount : 0) + '</td>' +
                        '<td>' + verified + '</td>' +
                        '</tr>'
                    );
                });
                renderPagination(result.data.pageCount, result.data.hasNextPage);
            })
            .catch(function (err)
            {
                console.error('Admin companies error:', err);
                body.html('<tr><td colspan="6" class="text-center p-a30"><p class="text-danger">Failed to load companies. Please try again.</p></td></tr>');
            });
    }

    function renderPagination(pageCount, hasNextPage)
    {
        pagination.empty();
        if (pageCount <= 1) return;
        pagination.append('<li class="previous ' + (currentPage === 1 ? 'disabled' : '') + '"><a href="javascript:void(0);" data-page="' + (currentPage - 1) + '"><i class="ti-arrow-left"></i> Prev</a></li>');
        for (var i = 1; i <= pageCount; i++)
        {
            pagination.append('<li class="' + (i === currentPage ? 'active' : '') + '"><a href="javascript:void(0);" data-page="' + i + '">' + i + '</a></li>');
        }
        pagination.append('<li class="next ' + (!hasNextPage ? 'disabled' : '') + '"><a href="javascript:void(0);" data-page="' + (currentPage + 1) + '">Next <i class="ti-arrow-right"></i></a></li>');
        pagination.find('a').off('click').on('click', function (e)
        {
            e.preventDefault();
            var p = parseInt($(this).attr('data-page'));
            if (p && p !== currentPage && p >= 1 && p <= pageCount) fetchCompanies(p);
        });
    }

    fetchCompanies(1);
});
