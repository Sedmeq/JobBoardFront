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
            list.append(
                '<li class="comment">' +
                '<div class="comment-body">' +
                '<div class="comment-author vcard"> <img class="avatar photo" src="' + avatar + '" alt="" onerror="this.src=\'images/testimonials/pic1.jpg\'"> ' +
                '<cite class="fn">' + escapeHtml(author) + '</cite> <span class="says">says:</span> </div>' +
                '<div class="comment-meta"> <a href="javascript:void(0);">' + formatDate(c.createdAt) + '</a> </div>' +
                '<p>' + escapeHtml(c.content) + '</p>' +
                '</div>' +
                '</li>'
            );
        });
    }

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
});
