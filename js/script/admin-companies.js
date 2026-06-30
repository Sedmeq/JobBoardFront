/**
 * Admin — Manage Companies.
 * Backend:
 *   GET   /api/admin/companies?keyword=&isVerified=&page=&pageSize=
 *   GET   /api/companies/{id}                 (profil baxışı)
 *   PATCH /api/admin/companies/{id}/verify    { isVerified }
 */
$(document).ready(function ()
{
    var body = $('#adminCompaniesBody');
    if (!body.length) return;

    var pagination = $('#adminCompaniesPagination');
    var currentPage = 1;
    var pageSize = 10;
    var byId = {};
    var viewModal = new bootstrap.Modal(document.getElementById('companyViewModal'));
    var activeCompanyId = null;

    function esc(t) { return $('<div>').text(t == null ? '' : t).html(); }

    function verifiedLabel(isVerified)
    {
        return isVerified
            ? '<span class="text-success" style="font-weight:600;"><i class="fa fa-check-circle"></i> Verified</span>'
            : '<span class="text-muted">Not verified</span>';
    }

    function fetchCompanies(page)
    {
        currentPage = page || 1;
        body.html('<tr><td colspan="7" class="text-center p-a30"><i class="fa fa-spinner fa-spin fa-2x text-primary"></i></td></tr>');
        pagination.empty();

        apiFetch('/admin/companies?page=' + currentPage + '&pageSize=' + pageSize)
            .then(function (result)
            {
                body.empty();
                byId = {};
                var items = (result && result.data && result.data.items) || [];
                if (!items.length)
                {
                    body.html('<tr><td colspan="7" class="text-center p-a30"><h5>No companies found</h5></td></tr>');
                    return;
                }
                items.forEach(function (c)
                {
                    byId[c.id] = c;
                    var verifyBtn = c.isVerified
                        ? '<button type="button" class="site-button button-sm c-verify" data-id="' + c.id + '" data-verify="false" style="background:#e67e22;border-color:#e67e22;">Unverify</button>'
                        : '<button type="button" class="site-button button-sm c-verify" data-id="' + c.id + '" data-verify="true" style="background:#1c8a55;border-color:#1c8a55;">Verify</button>';
                    body.append(
                        '<tr data-id="' + c.id + '">' +
                        '<td class="text-primary">#' + c.id + '</td>' +
                        '<td>' + esc(c.name || '-') + '</td>' +
                        '<td>' + esc(c.industry || '-') + '</td>' +
                        '<td>' + esc(c.location || '-') + '</td>' +
                        '<td>' + (c.jobsCount != null ? c.jobsCount : 0) + '</td>' +
                        '<td class="c-verified-cell">' + verifiedLabel(c.isVerified) + '</td>' +
                        '<td>' +
                        '<button type="button" class="site-button button-sm c-view" data-id="' + c.id + '" style="margin-right:6px;">View</button>' +
                        verifyBtn +
                        '</td>' +
                        '</tr>'
                    );
                });
                renderPagination(result.data.pageCount, result.data.hasNextPage);
            })
            .catch(function (err)
            {
                console.error('Admin companies error:', err);
                body.html('<tr><td colspan="7" class="text-center p-a30"><p class="text-danger">Failed to load companies. Please try again.</p></td></tr>');
            });
    }

    function row(label, value)
    {
        if (!value) return '';
        return '<tr><td style="width:160px;font-weight:600;">' + label + '</td><td>' + esc(value) + '</td></tr>';
    }

    function renderCompanyProfile(c)
    {
        var missing = [];
        if (!c.description) missing.push('Description');
        if (!c.industry) missing.push('Industry');
        if (!c.location) missing.push('Location');
        if (!c.phone) missing.push('Phone');
        if (!c.email) missing.push('Email');

        var completeNote = missing.length
            ? '<div class="alert alert-warning"><i class="fa fa-exclamation-triangle"></i> Profil tam deyil. Çatışmayan: <strong>' + esc(missing.join(', ')) + '</strong></div>'
            : '<div class="alert alert-success"><i class="fa fa-check"></i> Profil tam doldurulub.</div>';

        var logo = c.logoUrl
            ? '<img src="' + esc(c.logoUrl) + '" style="width:80px;height:80px;border-radius:10px;object-fit:contain;background:#f4f5f9;padding:6px;margin-right:14px;" onerror="this.style.display=\'none\'">'
            : '';

        var html =
            completeNote +
            '<div class="d-flex align-items-center m-b15">' + logo +
            '<div><h4 class="m-b0">' + esc(c.name || '-') + '</h4>' +
            '<span>' + verifiedLabel(c.isVerified) + '</span></div></div>' +
            '<table class="table table-sm">' +
            row('Industry', c.industry) +
            row('Location', c.location) +
            row('Company Size', c.companySize) +
            row('Phone', c.phone) +
            row('Email', c.email) +
            row('Website', c.website) +
            row('Founded', c.foundedYear) +
            row('Facebook', c.socialFacebook) +
            row('Twitter', c.socialTwitter) +
            row('LinkedIn', c.socialLinkedIn) +
            '</table>' +
            (c.description ? '<h6 class="m-t15">Description</h6><p>' + esc(c.description) + '</p>' : '');

        $('#companyViewBody').html(html);
    }

    function setModalButtons(isVerified)
    {
        if (isVerified) { $('#modalVerifyBtn').hide(); $('#modalUnverifyBtn').show(); }
        else { $('#modalVerifyBtn').show(); $('#modalUnverifyBtn').hide(); }
    }

    // View profile
    body.on('click', '.c-view', function ()
    {
        var id = $(this).attr('data-id');
        activeCompanyId = id;
        $('#companyViewBody').html('<div class="text-center p-a20"><i class="fa fa-spinner fa-spin fa-2x text-primary"></i></div>');
        viewModal.show();
        apiFetch('/companies/' + id)
            .then(function (res)
            {
                var c = res && res.data;
                if (!c) { $('#companyViewBody').html('<p class="text-danger">Profil yüklənmədi.</p>'); return; }
                renderCompanyProfile(c);
                setModalButtons(c.isVerified);
            })
            .catch(function ()
            {
                $('#companyViewBody').html('<p class="text-danger">Profil yüklənə bilmədi.</p>');
            });
    });

    // Verify/Unverify from table
    body.on('click', '.c-verify', function ()
    {
        var id = $(this).attr('data-id');
        var verify = $(this).attr('data-verify') === 'true';
        doVerify(id, verify);
    });

    // Verify/Unverify from modal
    $('#modalVerifyBtn').on('click', function () { if (activeCompanyId) doVerify(activeCompanyId, true, true); });
    $('#modalUnverifyBtn').on('click', function () { if (activeCompanyId) doVerify(activeCompanyId, false, true); });

    function doVerify(id, verify, fromModal)
    {
        apiFetch('/admin/companies/' + id + '/verify', {
            method: 'PATCH',
            body: JSON.stringify({ isVerified: verify })
        })
            .then(function ()
            {
                // cədvəl sətrini yenilə
                var r = $('tr[data-id="' + id + '"]');
                r.find('.c-verified-cell').html(verifiedLabel(verify));
                var btn = r.find('.c-verify');
                if (verify)
                    btn.attr('data-verify', 'false').text('Unverify').css({ 'background-color': '#e67e22', 'border-color': '#e67e22' });
                else
                    btn.attr('data-verify', 'true').text('Verify').css({ 'background-color': '#1c8a55', 'border-color': '#1c8a55' });
                if (byId[id]) byId[id].isVerified = verify;
                if (fromModal) setModalButtons(verify);
            })
            .catch(function (err)
            {
                var msg = (err && err.data && err.data.error && err.data.error.message) || 'Status dəyişdirilə bilmədi.';
                alert(msg);
            });
    }

    function renderPagination(pageCount, hasNextPage)
    {
        pagination.empty();
        if (!pageCount || pageCount <= 1) return;
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
