/**
 * Admin — Partners CRUD (ana səhifə loqoları).
 * Backend:
 *   GET    /api/partners/all          (admin — hamısı)
 *   POST   /api/partners              (admin — yarat, multipart: name, website, sortOrder, isActive, logo)
 *   PUT    /api/partners/{id}         (admin — yenilə, multipart)
 *   DELETE /api/partners/{id}         (admin — sil)
 */
$(document).ready(function ()
{
    var form = $('#partnerForm');
    if (!form.length) return;

    var alertEl = $('#partnerAlert');
    var tableBody = $('#partnerTableBody');
    var editId = null;
    var byId = {};

    function showAlert(msg, type)
    {
        alertEl.removeClass('alert-success alert-danger alert-info alert-warning')
            .addClass('alert-' + (type || 'info')).html(msg).slideDown(200);
        $('html, body').animate({ scrollTop: 0 }, 200);
        if (type !== 'success') setTimeout(function () { alertEl.slideUp(200); }, 6000);
    }

    function esc(str) { return $('<div>').text(str == null ? '' : str).html(); }

    function resetForm()
    {
        editId = null;
        form[0].reset();
        $('#partnerId').val('');
        $('#partnerActive').val('true');
        $('#partnerFormTitle').text('Add Partner');
        $('#partnerSubmitBtn').contents().first().replaceWith('Add Partner');
        $('#partnerLogoHint').show();
        $('#partnerCancelBtn').hide();
    }

    function loadPartners()
    {
        tableBody.html('<tr><td colspan="5" class="text-center p-a20"><i class="fa fa-spinner fa-spin fa-2x text-primary"></i></td></tr>');
        apiFetch('/partners/all')
            .then(function (result)
            {
                var items = (result && result.data) || [];
                tableBody.empty();
                byId = {};
                if (!items.length)
                {
                    tableBody.html('<tr><td colspan="5" class="text-center p-a20"><h6 class="m-a0">No partners yet.</h6></td></tr>');
                    return;
                }
                items.forEach(function (p)
                {
                    byId[p.id] = p;
                    var statusBadge = p.isActive
                        ? '<span style="color:#1c8a55;font-weight:600;">Active</span>'
                        : '<span style="color:#9aa1ad;font-weight:600;">Inactive</span>';
                    tableBody.append('' +
                        '<tr data-id="' + p.id + '">' +
                        '<td><img src="' + esc(p.logoUrl) + '" alt="" style="height:36px;max-width:120px;object-fit:contain;" onerror="this.style.display=\'none\'"></td>' +
                        '<td>' + esc(p.name) + (p.website ? '<br><small class="text-muted">' + esc(p.website) + '</small>' : '') + '</td>' +
                        '<td>' + (p.sortOrder || 0) + '</td>' +
                        '<td>' + statusBadge + '</td>' +
                        '<td class="text-end">' +
                        '<button type="button" class="site-button button-sm p-edit" data-id="' + p.id + '" style="margin-right:6px;">Edit</button>' +
                        '<button type="button" class="site-button button-sm p-delete" data-id="' + p.id + '" style="background-color:#e62e2e;">Delete</button>' +
                        '</td>' +
                        '</tr>');
                });
            })
            .catch(function (err)
            {
                console.error('Partners load error:', err);
                tableBody.html('<tr><td colspan="5" class="text-center p-a20 text-danger">Failed to load partners.</td></tr>');
            });
    }

    tableBody.on('click', '.p-edit', function ()
    {
        var p = byId[$(this).attr('data-id')];
        if (!p) return;
        editId = p.id;
        $('#partnerId').val(p.id);
        $('#partnerName').val(p.name || '');
        $('#partnerWebsite').val(p.website || '');
        $('#partnerSortOrder').val(p.sortOrder || 0);
        $('#partnerActive').val(p.isActive ? 'true' : 'false');
        $('#partnerLogo').val('');
        $('#partnerLogoHint').hide();
        $('#partnerFormTitle').text('Edit Partner');
        $('#partnerSubmitBtn').contents().first().replaceWith('Update Partner');
        $('#partnerCancelBtn').show();
        $('html, body').animate({ scrollTop: 0 }, 200);
    });

    tableBody.on('click', '.p-delete', function ()
    {
        var p = byId[$(this).attr('data-id')];
        if (!p) return;
        if (!confirm('Delete partner "' + p.name + '"?')) return;
        apiFetch('/partners/' + p.id, { method: 'DELETE' })
            .then(function (result)
            {
                showAlert((result && result.message) || 'Partner deleted.', 'success');
                if (editId === p.id) resetForm();
                loadPartners();
            })
            .catch(function (err)
            {
                var msg = (err && err.data && err.data.error && err.data.error.message) || 'Failed to delete partner.';
                showAlert(msg, 'danger');
            });
    });

    $('#partnerCancelBtn').on('click', resetForm);

    form.on('submit', function (e)
    {
        e.preventDefault();
        var name = $('#partnerName').val().trim();
        if (!name) { showAlert('Partner name is required.', 'danger'); return; }

        var logoFile = $('#partnerLogo')[0].files[0];
        if (!editId && !logoFile) { showAlert('Logo is required for a new partner.', 'danger'); return; }

        var fd = new FormData();
        fd.append('Name', name);
        fd.append('Website', $('#partnerWebsite').val().trim());
        fd.append('SortOrder', parseInt($('#partnerSortOrder').val()) || 0);
        fd.append('IsActive', $('#partnerActive').val());
        if (logoFile) fd.append('logo', logoFile);

        $('#partnerSpinner').show();
        $('#partnerSubmitBtn').prop('disabled', true);

        var endpoint = editId ? '/partners/' + editId : '/partners';
        var method = editId ? 'PUT' : 'POST';

        apiFetch(endpoint, { method: method, body: fd })
            .then(function (result)
            {
                $('#partnerSpinner').hide();
                $('#partnerSubmitBtn').prop('disabled', false);
                showAlert((result && result.message) || (editId ? 'Partner updated.' : 'Partner added.'), 'success');
                resetForm();
                loadPartners();
            })
            .catch(function (err)
            {
                $('#partnerSpinner').hide();
                $('#partnerSubmitBtn').prop('disabled', false);
                var msg = (err && err.data && err.data.error && err.data.error.message) || 'Failed to save partner.';
                showAlert(msg, 'danger');
            });
    });

    $('#partnerReloadBtn').on('click', loadPartners);

    loadPartners();
});
