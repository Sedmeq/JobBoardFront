/**
 * Blog Details integration.
 * Dokumentasiya:
 *   GET    /api/blog/posts/{slug}
 *   POST   /api/blog/posts/{id}/comments   { content }   (authenticated)
 */
$(document).ready(function ()
{
    if (!$('#bdTitle').length) return;

    var params = new URLSearchParams(window.location.search);
    var slug = params.get('slug');
    var postId = null;

    function escapeHtml(t) { return $('<div>').text(t == null ? '' : t).html(); }

    function formatDate(d)
    {
        if (!d) return '';
        return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    function showCommentAlert(msg, type)
    {
        var el = $('#bdCommentAlert');
        el.removeClass('alert-success alert-danger alert-info alert-warning')
            .addClass('alert-' + (type || 'info')).html(msg).slideDown(200);
        if (type !== 'success') setTimeout(function () { el.slideUp(200); }, 6000);
    }

    function renderComments(comments)
    {
        var currentUser = null;
        try { currentUser = JSON.parse(localStorage.getItem('user') || 'null'); } catch (e) { }
        var isAdmin = currentUser && currentUser.role === 'admin';

        var list = $('#bdCommentList');
        list.empty();
        if (!comments || !comments.length)
        {
            $('#bdCommentCount').text('0 Comments');
            list.html('<li class="comment"><div class="comment-body"><p class="text-muted">No comments yet. Be the first to comment!</p></div></li>');
            return;
        }
        $('#bdCommentCount').text(comments.length + ' Comment' + (comments.length > 1 ? 's' : ''));
        comments.forEach(function (c)
        {
            var author = (c.author && c.author.fullName) || 'User';
            var avatar = (c.author && c.author.avatarUrl) || 'images/testimonials/pic1.jpg';
            var canDelete = isAdmin || (currentUser && c.author && currentUser.id === c.author.id);
            var delBtn = canDelete
                ? ' <a href="javascript:void(0);" class="bd-comment-del" data-id="' + c.id + '" style="color:#c0392b;font-size:12px;margin-left:8px;"><i class="fa fa-trash"></i> Delete</a>'
                : '';
            list.append(
                '<li class="comment" data-cid="' + c.id + '">' +
                '<div class="comment-body">' +
                '<div class="comment-author vcard"> <img class="avatar photo" src="' + avatar + '" alt="" onerror="this.src=\'images/testimonials/pic1.jpg\'"> ' +
                '<cite class="fn">' + escapeHtml(author) + '</cite> <span class="says">says:</span> </div>' +
                '<div class="comment-meta"> <a href="javascript:void(0);">' + formatDate(c.createdAt) + '</a>' + delBtn + ' </div>' +
                '<p>' + escapeHtml(c.content) + '</p>' +
                '</div>' +
                '</li>'
            );
        });
    }

    // Şərh sil (admin və ya öz şərhi)
    $('#bdCommentList').on('click', '.bd-comment-del', function ()
    {
        var id = $(this).attr('data-id');
        if (!confirm('Delete this comment?')) return;
        var li = $('li[data-cid="' + id + '"]');
        li.css('opacity', '0.5');
        apiFetch('/blog/comments/' + id, { method: 'DELETE' })
            .then(function () { loadPost(); })
            .catch(function ()
            {
                li.css('opacity', '1');
                showCommentAlert('Could not delete the comment.', 'danger');
            });
    });

    function loadPost()
    {
        if (!slug)
        {
            $('#bdTitle').text('Article not found');
            $('#bdContent').html('<p class="text-danger">No article specified.</p>');
            return;
        }
        apiFetch('/blog/posts/' + encodeURIComponent(slug))
            .then(function (result)
            {
                if (!result.success || !result.data)
                {
                    $('#bdTitle').text('Article not found');
                    return;
                }
                var p = result.data;
                postId = p.id;
                document.title = 'Job Board - ' + p.title;
                $('#bdTitle').text(p.title);
                $('#bdDate').text(formatDate(p.publishedAt || p.createdAt));
                $('#bdAuthor').text((p.author && p.author.fullName) || 'Admin');
                $('#bdViews').text(p.viewCount != null ? p.viewCount : 0);
                if (p.featuredImageUrl) $('#bdImage').attr('src', p.featuredImageUrl);
                // Content HTML olaraq gəlir (dokumentasiyaya görə)
                $('#bdContent').html(p.content || '<p>No content.</p>');
                renderComments(p.comments);
            })
            .catch(function (err)
            {
                console.error('Blog post load error:', err);
                $('#bdTitle').text('Article not found');
                $('#bdContent').html('<p class="text-danger">Failed to load this article. Please try again.</p>');
            });
    }

    // Şərh göndər
    $('#commentform').on('submit', function (e)
    {
        e.preventDefault();
        var content = $('#bdCommentText').val().trim();
        if (!content) { showCommentAlert('Please write a comment.', 'danger'); return; }

        if (!localStorage.getItem('accessToken'))
        {
            showCommentAlert('Please <a href="login-3.html">sign in</a> to post a comment.', 'warning');
            return;
        }
        if (!postId) { showCommentAlert('Article not loaded yet. Please wait.', 'warning'); return; }

        $('#bdCommentSubmit').prop('disabled', true).val('Posting...');
        apiFetch('/blog/posts/' + postId + '/comments', {
            method: 'POST',
            body: JSON.stringify({ content: content })
        })
            .then(function ()
            {
                $('#bdCommentSubmit').prop('disabled', false).val('Post Comment');
                $('#bdCommentText').val('');
                showCommentAlert('Your comment has been posted.', 'success');
                loadPost(); // şərhləri yenilə
            })
            .catch(function (err)
            {
                $('#bdCommentSubmit').prop('disabled', false).val('Post Comment');
                var msg = (err && err.data && err.data.error && err.data.error.message) || 'Failed to post comment. Please try again.';
                showCommentAlert(msg, 'danger');
            });
    });

    loadPost();

    // ─── Sidebar: search, recent posts, categories, tags ─────
    $('#bdSearchForm').on('submit', function (e)
    {
        e.preventDefault();
        var kw = $('#bdSearchInput').val().trim();
        window.location.href = 'blog-classic-sidebar.html' + (kw ? '?keyword=' + encodeURIComponent(kw) : '');
    });

    apiFetch('/blog/posts?page=1&pageSize=5')
        .then(function (result)
        {
            var box = $('#bdRecentPosts');
            var items = (result && result.data && result.data.items) || [];
            box.empty();
            if (!items.length) { box.html('<p class="text-muted font-13">No posts yet.</p>'); return; }
            items.forEach(function (post)
            {
                var img = post.featuredImageUrl || 'images/blog/recent-blog/pic1.jpg';
                var link = 'blog-details.html?slug=' + encodeURIComponent(post.slug);
                box.append(
                    '<div class="widget-post clearfix">' +
                    '<div class="dez-post-media"> <img src="' + img + '" width="200" height="143" alt="" onerror="this.src=\'images/blog/recent-blog/pic1.jpg\'"> </div>' +
                    '<div class="dez-post-info"><div class="dez-post-header">' +
                    '<h6 class="post-title"><a href="' + link + '">' + escapeHtml(post.title) + '</a></h6></div>' +
                    '<div class="dez-post-meta"><ul class="d-flex align-items-center">' +
                    '<li class="post-date"><i class="fa fa-calendar"></i> ' + formatDate(post.publishedAt || post.createdAt) + '</li>' +
                    '<li class="post-comment"><i class="far fa-comments"></i> ' + (post.commentCount || 0) + '</li>' +
                    '</ul></div></div></div>'
                );
            });
        })
        .catch(function () { });

    apiFetch('/blog/categories')
        .then(function (result)
        {
            var ul = $('#bdCategoriesList');
            var items = (result && result.data) || [];
            ul.empty();
            if (!items.length) { ul.html('<li class="text-muted font-13">No categories.</li>'); return; }
            items.forEach(function (c)
            {
                ul.append('<li><a href="blog-classic-sidebar.html?category=' + encodeURIComponent(c.category) + '">' +
                    escapeHtml(c.category) + ' (' + (c.postCount || 0) + ')</a></li>');
            });
        })
        .catch(function () { });

    apiFetch('/blog/tags')
        .then(function (result)
        {
            var box = $('#bdTagsList');
            var items = (result && result.data) || [];
            box.empty();
            if (!items.length) { box.html('<span class="text-muted font-13">No tags.</span>'); return; }
            items.forEach(function (t)
            {
                box.append('<a href="blog-classic-sidebar.html?tag=' + encodeURIComponent(t.tag) + '">' + escapeHtml(t.tag) + '</a> ');
            });
        })
        .catch(function () { });
});
