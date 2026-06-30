/**
 * Admin — Categories CRUD.
 * Dokumentasiya:
 *   GET    /api/categories                 (siyahı)
 *   POST   /api/admin/categories           (yarat)
 *   PUT    /api/categories/{id}            (yenilə)
 *   DELETE /api/categories/{id}            (sil)
 */
$(document).ready(function ()
{
    var form = $('#categoryForm');
    if (!form.length) return;

    var alertEl = $('#catAlert');
    var tableBody = $('#catTableBody');
    var editId = null;
    var categoriesById = {};

    function showAlert(msg, type)
    {
        alertEl.removeClass('alert-success alert-danger alert-info alert-warning')
            .addClass('alert-' + (type || 'info')).html(msg).slideDown(200);
        $('html, body').animate({ scrollTop: 0 }, 200);
        if (type !== 'success') setTimeout(function () { alertEl.slideUp(200); }, 6000);
    }

    function escapeHtml(str)
    {
        return $('<div>').text(str == null ? '' : str).html();
    }

    function resetForm()
    {
        editId = null;
        form[0].reset();
        $('#catId').val('');
        $('#catFormTitle').text('Create Category');
        $('#catSubmitBtn').contents().first().replaceWith('Create Category');
        $('#catCancelBtn').hide();
    }

    // ---- Siyahını yüklə ----
    function loadCategories()
    {
        tableBody.html('<tr><td colspan="5" class="text-center p-a20"><i class="fa fa-spinner fa-spin fa-2x text-primary"></i></td></tr>');
        apiFetch('/categories?includeJobCount=true')
            .then(function (result)
            {
                var items = (result && result.data) || [];
                tableBody.empty();
                categoriesById = {};
                if (!items.length)
                {
                    tableBody.html('<tr><td colspan="5" class="text-center p-a20"><h6 class="m-a0">No categories yet.</h6></td></tr>');
                    return;
                }
                items.forEach(function (c)
                {
                    categoriesById[c.id] = c;
                    var icon = c.iconClass || '';
                    var iconHtml = icon
                        ? (icon.indexOf('fa') === 0 ? '<i class="' + escapeHtml(icon) + '"></i>' : escapeHtml(icon))
                        : '-';
                    var row = '' +
                        '<tr data-id="' + c.id + '">' +
                        '<td>' + iconHtml + '</td>' +
                        '<td>' + escapeHtml(c.name) + '</td>' +
                        '<td>' + escapeHtml(c.slug) + '</td>' +
                        '<td>' + (c.jobCount || 0) + '</td>' +
                        '<td class="text-end">' +
                        '<button type="button" class="site-button button-sm cat-edit-btn" data-id="' + c.id + '" style="margin-right:6px;">Edit</button>' +
                        '<button type="button" class="site-button button-sm cat-delete-btn" data-id="' + c.id + '" style="background-color:#e62e2e;">Delete</button>' +
                        '</td>' +
                        '</tr>';
                    tableBody.append(row);
                });
            })
            .catch(function (err)
            {
                console.error('Categories load error:', err);
                tableBody.html('<tr><td colspan="5" class="text-center p-a20 text-danger">Failed to load categories.</td></tr>');
            });
    }

    // ---- Edit rejiminə keç ----
    tableBody.on('click', '.cat-edit-btn', function ()
    {
        var id = $(this).attr('data-id');
        var c = categoriesById[id];
        if (!c) return;
        editId = c.id;
        $('#catId').val(c.id);
        $('#catName').val(c.name || '');
        $('#catIcon').val(c.iconClass || '');
        $('#catColor').val(c.color || '');
        $('#catSortOrder').val(c.sortOrder || 0);
        $('#catDescription').val(c.description || '');
        $('#catFormTitle').text('Edit Category');
        $('#catSubmitBtn').contents().first().replaceWith('Update Category');
        $('#catCancelBtn').show();
        $('html, body').animate({ scrollTop: 0 }, 200);
    });

    // ---- Sil ----
    tableBody.on('click', '.cat-delete-btn', function ()
    {
        var id = $(this).attr('data-id');
        var c = categoriesById[id];
        if (!c) return;
        if (!confirm('Delete category "' + c.name + '"? This cannot be undone.')) return;

        apiFetch('/categories/' + c.id, { method: 'DELETE' })
            .then(function (result)
            {
                showAlert((result && result.message) || 'Category deleted.', 'success');
                if (editId === c.id) resetForm();
                loadCategories();
            })
            .catch(function (err)
            {
                var msg = (err && err.data && err.data.error && err.data.error.message) || 'Failed to delete category.';
                showAlert(msg, 'danger');
            });
    });

    // ---- Cancel edit ----
    $('#catCancelBtn').on('click', function () { resetForm(); });

    // ---- Create / Update ----
    form.on('submit', function (e)
    {
        e.preventDefault();
        var name = $('#catName').val().trim();
        if (!name) { showAlert('Category name is required.', 'danger'); return; }

        var sortOrder = parseInt($('#catSortOrder').val());
        var payload = {
            name: name,
            description: $('#catDescription').val().trim(),
            icon: $('#catIcon').val().trim(),
            color: $('#catColor').val().trim() || null,
            sortOrder: isNaN(sortOrder) ? 0 : sortOrder
        };

        $('#catSpinner').show();
        $('#catSubmitBtn').prop('disabled', true);

        var endpoint = editId ? '/categories/' + editId : '/admin/categories';
        var method = editId ? 'PUT' : 'POST';

        apiFetch(endpoint, { method: method, body: JSON.stringify(payload) })
            .then(function (result)
            {
                $('#catSpinner').hide();
                $('#catSubmitBtn').prop('disabled', false);
                showAlert((result && result.message) || (editId ? 'Category updated.' : 'Category created.'), 'success');
                resetForm();
                loadCategories();
            })
            .catch(function (err)
            {
                $('#catSpinner').hide();
                $('#catSubmitBtn').prop('disabled', false);
                var msg = (err && err.data && err.data.error && err.data.error.message) || 'Failed to save category. Please try again.';
                showAlert(msg, 'danger');
            });
    });

    $('#catReloadBtn').on('click', function () { loadCategories(); });

    loadCategories();
});
