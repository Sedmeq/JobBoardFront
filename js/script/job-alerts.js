/**
 * Job Alerts integration (Candidate).
 * Dokumentasiya:
 *   GET    /api/alerts
 *   POST   /api/alerts            { name, keyword, location, categoryId, jobType, frequency }
 *   DELETE /api/alerts/{id}
 *   PATCH  /api/alerts/{id}/toggle { isActive }
 *   GET    /api/categories        (dropdown üçün)
 */
$(document).ready(function ()
{
    var tbody = $('#alertsBody');
    if (!tbody.length) return;

    // Giriş tələb olunur
    if (!localStorage.getItem('accessToken'))
    {
        window.location.href = 'login-3.html';
        return;
    }

    var titleLabel = $('#alertsTitle');
    var alertEl = $('#alertsMessage');

    function escapeHtml(t) { return $('<div>').text(t == null ? '' : t).html(); }

    function formatDate(d)
    {
        if (!d) return '';
        var dt = new Date(d);
        var months = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        return months[dt.getMonth()] + ' ' + dt.getDate() + ',' + dt.getFullYear();
    }

    function showMessage(msg, type)
    {
        alertEl.removeClass('alert-success alert-danger alert-info')
            .addClass('alert alert-' + (type || 'info')).html(msg).slideDown(200);
        setTimeout(function () { alertEl.slideUp(200); }, 5000);
    }

    function buildCriteria(a)
    {
        var parts = [];
        if (a.keyword) parts.push(escapeHtml(a.keyword));
        if (a.location) parts.push(escapeHtml(a.location));
        if (a.jobType) parts.push(escapeHtml(a.jobType));
        return parts.length ? parts.join(' • ') : '<span class="text-muted">Bütün iş elanları</span>';
    }

    function loadCategories()
    {
        apiFetch('/categories?includeJobCount=false')
            .then(function (result)
            {
                if (!result.success || !result.data) return;
                var sel = $('#alertCategory');
                result.data.forEach(function (c)
                {
                    sel.append('<option value="' + c.id + '">' + escapeHtml(c.name) + '</option>');
                });
            })
            .catch(function (err) { console.error('Categories load error:', err); });
    }

    function fetchAlerts()
    {
        tbody.html('<tr><td colspan="5" class="text-center p-a20"><i class="fa fa-spinner fa-spin fa-2x text-primary"></i></td></tr>');
        titleLabel.text('Loading...');

        apiFetch('/alerts')
            .then(function (result)
            {
                tbody.empty();
                var items = (result && result.data) || [];
                if (!items.length)
                {
                    titleLabel.text('0 Job Alerts');
                    tbody.html('<tr><td colspan="5" class="text-center p-a30"><h6>Hələ heç bir bildiriş yaratmamısınız.</h6></td></tr>');
                    return;
                }
                titleLabel.text(items.length + ' Job Alerts');

                items.forEach(function (a)
                {
                    var checked = a.isActive ? 'checked' : '';
                    tbody.append(
                        '<tr data-alert-row="' + a.id + '">' +
                        '<td class="job-name"><a href="browse-job-list.html">' + escapeHtml(a.name) + '</a>' +
                        '<br><small class="text-muted" style="text-transform:capitalize;">' + escapeHtml(a.frequency) + '</small></td>' +
                        '<td class="criterias">' + buildCriteria(a) + '</td>' +
                        '<td class="date">' + formatDate(a.createdAt) + '</td>' +
                        '<td><label class="switch" style="cursor:pointer;"><input type="checkbox" data-toggle-alert="' + a.id + '" ' + checked + '> <span style="margin-left:5px;">' + (a.isActive ? 'Active' : 'Paused') + '</span></label></td>' +
                        '<td class="job-links">' +
                        '<a href="javascript:void(0);" data-delete-alert="' + a.id + '" title="Delete"><i class="ti-trash"></i></a>' +
                        '</td>' +
                        '</tr>'
                    );
                });

                setupRowActions();
            })
            .catch(function (err)
            {
                console.error('Alerts fetch error:', err);
                titleLabel.text('Error');
                tbody.html('<tr><td colspan="5" class="text-center p-a30 text-danger">Bildirişlər yüklənə bilmədi.</td></tr>');
            });
    }

    function setupRowActions()
    {
        $('[data-delete-alert]').off('click').on('click', function ()
        {
            var id = $(this).attr('data-delete-alert');
            if (!confirm('Bu bildirişi silmək istəyirsiniz?')) return;
            apiFetch('/alerts/' + id, { method: 'DELETE' })
                .then(function ()
                {
                    showMessage('Bildiriş silindi.', 'success');
                    fetchAlerts();
                })
                .catch(function () { showMessage('Bildiriş silinə bilmədi.', 'danger'); });
        });

        $('[data-toggle-alert]').off('change').on('change', function ()
        {
            var id = $(this).attr('data-toggle-alert');
            var isActive = $(this).is(':checked');
            apiFetch('/alerts/' + id + '/toggle', {
                method: 'PATCH',
                body: JSON.stringify({ isActive: isActive })
            })
                .then(function ()
                {
                    $('tr[data-alert-row="' + id + '"]').find('label.switch span').text(isActive ? 'Active' : 'Paused');
                })
                .catch(function () { showMessage('Status dəyişdirilə bilmədi.', 'danger'); });
        });
    }

    $('#createAlertForm').on('submit', function (e)
    {
        e.preventDefault();
        var name = $('#alertName').val().trim();
        if (!name)
        {
            showMessage('Bildiriş adı tələb olunur.', 'danger');
            return;
        }
        var categoryId = $('#alertCategory').val();
        var payload = {
            name: name,
            keyword: $('#alertKeyword').val().trim() || null,
            location: $('#alertLocation').val().trim() || null,
            categoryId: categoryId ? parseInt(categoryId) : null,
            jobType: $('#alertJobType').val() || null,
            frequency: $('#alertFrequency').val() || 'daily'
        };

        var btn = $('#createAlertBtn');
        var original = btn.html();
        btn.prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i>');

        apiFetch('/alerts', { method: 'POST', body: JSON.stringify(payload) })
            .then(function ()
            {
                btn.prop('disabled', false).html(original);
                $('#createAlertForm')[0].reset();
                showMessage('Yeni bildiriş yaradıldı.', 'success');
                fetchAlerts();
            })
            .catch(function (err)
            {
                btn.prop('disabled', false).html(original);
                var msg = (err && err.data && err.data.error && err.data.error.message) || 'Bildiriş yaradıla bilmədi.';
                showMessage(msg, 'danger');
            });
    });

    loadCategories();
    fetchAlerts();
});
