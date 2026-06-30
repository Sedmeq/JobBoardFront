/**
 * Admin — Blog CRUD + Comments management.
 * Backend:
 *   GET    /api/blog/posts?page=&pageSize=   (admin draft-ləri də görür)
 *   POST   /api/blog/posts
 *   PUT    /api/blog/posts/{id}
 *   DELETE /api/blog/posts/{id}
 *   GET    /api/blog/comments?page=&pageSize=
 *   DELETE /api/blog/comments/{id}
 */
$(document).ready(function ()
{
    var form = $('#blogForm');
    if (!form.length) return;

    var alertEl = $('#blogAlert');
    var postsBody = $('#blogTableBody');
    var commentsBody = $('#commentTableBody');
    var editId = null;
    var postsById = {};

    function esc(s) { return $('<div>').text(s == null ? '' : s).html(); }

    function showAlert(msg, type)
    {
        alertEl.removeClass('alert-success alert-danger alert-info alert-warning')
            .addClass('alert-' + (type || 'info')).html(msg).slideDown(200);
        $('html, body').animate({ scrollTop: 0 }, 200);
        if (type !== 'success') setTimeout(function () { alertEl.slideUp(200); }, 6000);
    }

    function resetForm()
    {
        editId = null;
        form[0].reset();
        $('#blogId').val('');
        $('#blogStatus').val('published');
        $('#blogFeatured').val('false');
        $('#blogFormTitle').text('Create Post');
        $('#blogSubmitBtn').contents().first().replaceWith('Create Post');
        $('#blogCancelBtn').hide();
        $('#blogImagePreview').hide();
        $('#blogImageFile').val('');
    }

    // ---- Posts ----
    function loadPosts()
    {
        postsBody.html('<tr><td colspan="5" class="text-center p-a20"><i class="fa fa-spinner fa-spin fa-2x text-primary"></i></td></tr>');
        apiFetch('/blog/posts?page=1&pageSize=50')
            .then(function (result)
            {
                var items = (result && result.data && result.data.items) || [];
                postsBody.empty();
                postsById = {};
                if (!items.length)
                {
                    postsBody.html('<tr><td colspan="5" class="text-center p-a20"><h6 class="m-a0">No posts yet.</h6></td></tr>');
                    return;
                }
                items.forEach(function (p)
                {
                    postsById[p.id] = p;
                    var statusBadge = p.status === 'published'
                        ? '<span style="color:#1c8a55;font-weight:600;">Published</span>'
                        : '<span style="color:#b8860b;font-weight:600;">Draft</span>';
                    postsBody.append('' +
                        '<tr data-id="' + p.id + '">' +
                        '<td><a href="blog-details.html?slug=' + encodeURIComponent(p.slug) + '" target="_blank">' + esc(p.title) + '</a></td>' +
                        '<td>' + esc(p.category || '-') + '</td>' +
                        '<td>' + statusBadge + '</td>' +
                        '<td>' + (p.viewCount || 0) + '</td>' +
                        '<td class="text-end">' +
                        '<button type="button" class="site-button button-sm b-edit" data-id="' + p.id + '" style="margin-right:6px;">Edit</button>' +
                        '<button type="button" class="site-button button-sm b-delete" data-id="' + p.id + '" style="background:#e62e2e;">Delete</button>' +
                        '</td></tr>');
                });
            })
            .catch(function (err)
            {
                console.error('Posts load error:', err);
                postsBody.html('<tr><td colspan="5" class="text-center p-a20 text-danger">Failed to load posts.</td></tr>');
            });
    }

    postsBody.on('click', '.b-edit', function ()
    {
        var p = postsById[$(this).attr('data-id')];
        if (!p) return;
        // Tam məzmunu detaldan götür (list-də content yoxdur)
        apiFetch('/blog/posts/' + encodeURIComponent(p.slug))
            .then(function (res)
            {
                var d = (res && res.data) || p;
                editId = d.id;
                $('#blogId').val(d.id);
                $('#blogTitle').val(d.title || '');
                $('#blogCategory').val(d.category || '');
                $('#blogStatus').val(d.status || 'published');
                $('#blogReadTime').val(d.readTimeMinutes || 0);
                $('#blogFeatured').val(d.isFeatured ? 'true' : 'false');
                $('#blogImage').val(d.featuredImageUrl || '');
                showImagePreview(d.featuredImageUrl || '');
                $('#blogTags').val((d.tags || []).join(', '));
                $('#blogExcerpt').val(d.excerpt || '');
                $('#blogContent').val(d.content || '');
                $('#blogFormTitle').text('Edit Post');
                $('#blogSubmitBtn').contents().first().replaceWith('Update Post');
                $('#blogCancelBtn').show();
                $('html, body').animate({ scrollTop: 0 }, 200);
            })
            .catch(function () { showAlert('Could not load post content.', 'danger'); });
    });

    postsBody.on('click', '.b-delete', function ()
    {
        var p = postsById[$(this).attr('data-id')];
        if (!p) return;
        if (!confirm('Delete post "' + p.title + '"?')) return;
        apiFetch('/blog/posts/' + p.id, { method: 'DELETE' })
            .then(function (r)
            {
                showAlert((r && r.message) || 'Post deleted.', 'success');
                if (editId === p.id) resetForm();
                loadPosts();
            })
            .catch(function (err)
            {
                var msg = (err && err.data && err.data.error && err.data.error.message) || 'Failed to delete post.';
                showAlert(msg, 'danger');
            });
    });

    $('#blogCancelBtn').on('click', resetForm);

    form.on('submit', function (e)
    {
        e.preventDefault();
        var title = $('#blogTitle').val().trim();
        var content = $('#blogContent').val().trim();
        if (!title) { showAlert('Title is required.', 'danger'); return; }
        if (!content) { showAlert('Content is required.', 'danger'); return; }

        var tags = $('#blogTags').val().split(',').map(function (t) { return t.trim(); }).filter(function (t) { return t; });
        var payload = {
            title: title,
            content: content,
            excerpt: $('#blogExcerpt').val().trim(),
            featuredImageUrl: $('#blogImage').val().trim() || null,
            category: $('#blogCategory').val().trim() || null,
            status: $('#blogStatus').val(),
            isFeatured: $('#blogFeatured').val() === 'true',
            readTimeMinutes: parseInt($('#blogReadTime').val()) || 0,
            tags: tags
        };

        $('#blogSpinner').show();
        $('#blogSubmitBtn').prop('disabled', true);

        var endpoint = editId ? '/blog/posts/' + editId : '/blog/posts';
        var method = editId ? 'PUT' : 'POST';

        apiFetch(endpoint, { method: method, body: JSON.stringify(payload) })
            .then(function (r)
            {
                $('#blogSpinner').hide();
                $('#blogSubmitBtn').prop('disabled', false);
                showAlert((r && r.message) || (editId ? 'Post updated.' : 'Post created.'), 'success');
                resetForm();
                loadPosts();
            })
            .catch(function (err)
            {
                $('#blogSpinner').hide();
                $('#blogSubmitBtn').prop('disabled', false);
                var msg = (err && err.data && err.data.error && err.data.error.message) || 'Failed to save post.';
                showAlert(msg, 'danger');
            });
    });

    $('#blogReloadBtn').on('click', loadPosts);

    // ---- Featured image: kompüterdən yüklə ----
    function showImagePreview(url)
    {
        if (url) $('#blogImagePreview').attr('src', url).show();
        else $('#blogImagePreview').hide();
    }
    $('#blogImage').on('input', function () { showImagePreview($(this).val().trim()); });

    $('#blogImageFile').on('change', function ()
    {
        var file = this.files && this.files[0];
        if (!file) return;
        $('#blogImagePreview').attr('src', URL.createObjectURL(file)).show();
        $('#blogImageSpinner').show();
        var fd = new FormData();
        fd.append('file', file);
        apiFetch('/blog/upload-image', { method: 'POST', body: fd })
            .then(function (res)
            {
                $('#blogImageSpinner').hide();
                var url = res && res.data && res.data.url;
                if (url) { $('#blogImage').val(url); showImagePreview(url); }
            })
            .catch(function (err)
            {
                $('#blogImageSpinner').hide();
                var msg = (err && err.data && err.data.error && err.data.error.message) || 'Şəkil yüklənmədi.';
                showAlert(msg, 'danger');
            });
    });

    // ---- Comments ----
    function loadComments()
    {
        commentsBody.html('<tr><td colspan="4" class="text-center p-a20"><i class="fa fa-spinner fa-spin fa-2x text-primary"></i></td></tr>');
        apiFetch('/blog/comments?page=1&pageSize=50')
            .then(function (result)
            {
                var items = (result && result.data && result.data.items) || [];
                commentsBody.empty();
                if (!items.length)
                {
                    commentsBody.html('<tr><td colspan="4" class="text-center p-a20"><h6 class="m-a0">No comments yet.</h6></td></tr>');
                    return;
                }
                items.forEach(function (c)
                {
                    var snippet = c.content || '';
                    if (snippet.length > 80) snippet = snippet.substring(0, 80) + '…';
                    commentsBody.append('' +
                        '<tr data-cid="' + c.id + '">' +
                        '<td>' + esc(c.authorName) + '</td>' +
                        '<td>' + esc(snippet) + '</td>' +
                        '<td><a href="blog-details.html?slug=' + encodeURIComponent(c.postSlug) + '" target="_blank">' + esc(c.postTitle) + '</a></td>' +
                        '<td class="text-end"><button type="button" class="site-button button-sm cmt-delete" data-id="' + c.id + '" style="background:#e62e2e;">Delete</button></td>' +
                        '</tr>');
                });
            })
            .catch(function (err)
            {
                console.error('Comments load error:', err);
                commentsBody.html('<tr><td colspan="4" class="text-center p-a20 text-danger">Failed to load comments.</td></tr>');
            });
    }

    commentsBody.on('click', '.cmt-delete', function ()
    {
        var id = $(this).attr('data-id');
        if (!confirm('Delete this comment? (Uyğunsuz məzmun)')) return;
        var row = $('tr[data-cid="' + id + '"]');
        row.css('opacity', '0.5');
        apiFetch('/blog/comments/' + id, { method: 'DELETE' })
            .then(function () { row.fadeOut(300, function () { row.remove(); }); })
            .catch(function ()
            {
                row.css('opacity', '1');
                showAlert('Could not delete comment.', 'danger');
            });
    });

    $('#commentReloadBtn').on('click', loadComments);

    loadPosts();
    loadComments();
});
