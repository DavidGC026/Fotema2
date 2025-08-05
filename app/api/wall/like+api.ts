import { getConnection } from '@/lib/database';

export async function POST(request: Request) {
  try {
    const { wallPhotoId, userId } = await request.json();

    if (!wallPhotoId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Wall photo ID and user ID are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const conn = await getConnection();
    
    // Check if already liked
    const [existingLike] = await conn.execute(
      'SELECT id FROM wall_photo_likes WHERE wall_photo_id = ? AND user_id = ?',
      [wallPhotoId, userId]
    ) as any;

    if (existingLike.length > 0) {
      // Unlike
      await conn.execute(
        'DELETE FROM wall_photo_likes WHERE wall_photo_id = ? AND user_id = ?',
        [wallPhotoId, userId]
      );
      
      await conn.execute(
        'UPDATE wall_photos SET likes_count = likes_count - 1 WHERE id = ?',
        [wallPhotoId]
      );

      return new Response(
        JSON.stringify({ liked: false, message: 'Photo unliked' }),
        { 
          status: 200, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );
    } else {
      // Like
      await conn.execute(
        'INSERT INTO wall_photo_likes (wall_photo_id, user_id) VALUES (?, ?)',
        [wallPhotoId, userId]
      );
      
      await conn.execute(
        'UPDATE wall_photos SET likes_count = likes_count + 1 WHERE id = ?',
        [wallPhotoId]
      );

      return new Response(
        JSON.stringify({ liked: true, message: 'Photo liked' }),
        { 
          status: 200, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );
    }
  } catch (error) {
    console.error('Like wall photo error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}