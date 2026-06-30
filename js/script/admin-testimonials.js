/**
 * Admin — Testimonials CRUD (ana səhifə müştəri rəyləri).
 * Backend:
 *   GET    /api/testimonials/all       (admin — hamısı)
 *   POST   /api/testimonials           (admin — yarat, multipart: name, subtitle, message, sortOrder, isActive, avatar)
 *   PUT    /api/testimonials/{id}      (admin — yenilə, multipart)
 *   DELETE /api/testimonials/{id}      (admin — sil)
 */
$(document).ready(function ()
{
    var form = $('#testimonialForm');
    if (!form.length) return;

    var alertEl = $('#tAlert');
    var tableBody = $('#tTableBody');
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
        $('#tId').val('');
        $('#tActive').val('true');
        $('#tFormTitle').text('Add Testimonial');
        $('#tSubmitBtn').contents().first().replaceWith('Add Testimonial');
        $('#tCancelBtn').hide();
    }

    function loadTestimonials()
    {
        tableBody.html('<tr><td colspan="6" class="text-center p-a20"><i class="fa fa-spinner fa-spin fa-2x text-primary"></i></td></tr>');
        apiFetch('/testimonials/all')
            .then(function (result)
            {
                var items = (result && result.data) || [];
                tableBody.empty();
                byId = {};
                if (!items.length)
                {
                    tableBody.html('<tr><td colspan="6" class="text-center p-a20"><h6 class="m-a0">No testimonials yet.</h6></td></tr>');
                    return;
                }
                items.forEach(function (t)
                {
                    byId[t.id] = t;
                    var statusBadge = t.isActive
                        ? '<span style="color:#1c8a55;font-weight:600;">Active</span>'
                        : '<span style="color:#9aa1ad;font-weight:600;">Inactive</span>';
                    var avatar = t.avatarUrl
                        ? '<img src="' + esc(t.avatarUrl) + '" alt="" style="width:40px;height:40px;border-radius:50%;object-fit:cover;" onerror="this.style.display=\'none\'">'
                        : '<span class="text-muted">—</span>';
                    var snippet = (t.message || '');
                    if (snippet.length > 60) snippet = snippet.substring(0, 60) + '…';
                    tableBody.append('' +
                        '<tr data-id="' + t.id + '">' +
                        '<td>' + avatar + '</td>' +
                        '<td>' + esc(t.name) + (t.subtitle ? '<br><small class="text-muted">' + esc(t.subtitle) + '</small>' : '') + '</td>' +
                        '<td>' + esc(snippet) + '</td>' +
                        '<td>' + (t.sortOrder || 0) + '</td>' +
                        '<td>' + statusBadge + '</td>' +
                        '<td class="text-end">' +
                        '<button type="button" class="site-button button-sm t-edit" data-id="' + t.id + '" style="margin-right:6px;">Edit</button>' +
                        '<button type="button" class="site-button button-sm t-delete" data-id="' + t.id + '" style="background-color:#e62e2e;">Delete</button>' +
                        '</td>' +
                        '</tr>');
                });
            })
            .catch(function (err)
            {
                console.error('Testimonials load error:', err);
                tableBody.html('<tr><td colspan="6" class="text-center p-a20 text-danger">Failed to load testimonials.</td></tr>');
            });
    }

    tableBody.on('click', '.t-edit', function ()
    {
        var t = byId[$(this).attr('data-id')];
        if (!t) return;
        editId = t.id;
        $('#tId').val(t.id);
        $('#tName').val(t.name || '');
        $('#tSubtitle').val(t.subtitle || '');
        $('#tMessage').val(t.message || '');
        $('#tSortOrder').val(t.sortOrder || 0);
        $('#tActive').val(t.isActive ? 'true' : 'false');
        $('#tAvatar').val('');
        $('#tFormTitle').text('Edit Testimonial');
        $('#tSubmitBtn').contents().first().replaceWith('Update Testimonial');
        $('#tCancelBtn').show();
        $('html, body').animate({ scrollTop: 0 }, 200);
    });

    tableBody.on('click', '.t-delete', function ()
    {
        var t = byId[$(this).attr('data-id')];
        if (!t) return;
        if (!confirm('Delete testimonial from "' + t.name + '"?')) return;
        apiFetch('/testimonials/' + t.id, { method: 'DELETE' })
            .then(function (result)
            {
                showAlert((result && result.message) || 'Testimonial deleted.', 'success');
                if (editId === t.id) resetForm();
                loadTestimonials();
            })
            .catch(function (err)
            {
                var msg = (err && err.data && err.data.error && err.data.error.message) || 'Failed to delete testimonial.';
                showAlert(msg, 'danger');
            });
    });

    $('#tCancelBtn').on('click', resetForm);

    form.on('submit', function (e)
    {
        e.preventDefault();
        var name = $('#tName').val().trim();
        var message = $('#tMessage').val().trim();
        if (!name) { showAlert('Name is required.', 'danger'); return; }
        if (!message) { showAlert('Message is required.', 'danger'); return; }

        var fd = new FormData();
        fd.append('Name', name);
        fd.append('Subtitle', $('#tSubtitle').val().trim());
        fd.append('Message', message);
        fd.append('SortOrder', parseInt($('#tSortOrder').val()) || 0);
        fd.append('IsActive', $('#tActive').val());
        var avatarFile = $('#tAvatar')[0].files[0];
        if (avatarFile) fd.append('avatar', avatarFile);

        $('#tSpinner').show();
        $('#tSubmitBtn').prop('disabled', true);

        var endpoint = editId ? '/testimonials/' + editId : '/testimonials';
        var method = editId ? 'PUT' : 'POST';

        apiFetch(endpoint, { method: method, body: fd })
            .then(function (result)
            {
                $('#tSpinner').hide();
                $('#tSubmitBtn').prop('disabled', false);
                showAlert((result && result.message) || (editId ? 'Testimonial updated.' : 'Testimonial added.'), 'success');
                resetForm();
                loadTestimonials();
            })
            .catch(function (err)
            {
                $('#tSpinner').hide();
                $('#tSubmitBtn').prop('disabled', false);
                var msg = (err && err.data && err.data.error && err.data.error.message) || 'Failed to save testimonial.';
                showAlert(msg, 'danger');
            });
    });

    $('#tReloadBtn').on('click', loadTestimonials);

    loadTestimonials();
});
