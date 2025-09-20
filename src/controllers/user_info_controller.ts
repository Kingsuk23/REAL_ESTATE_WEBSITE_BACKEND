import { Request, Response } from 'express';
import { try_catch_handler } from '../middlewares/centralized_error_handler';
import { prisma, redis_client } from '../configs/db_config';
import { StatusCodes } from 'http-status-codes';

export const get_user_info = try_catch_handler(
  async (req: Request, res: Response) => {
    const { id } = req.user;

    const user_cache_exist = await redis_client.get(`user_cache_${id}`);

    if (user_cache_exist) {
      const user_data = JSON.parse(user_cache_exist);
      return res
        .status(StatusCodes.OK)
        .json({ message: 'User find', user: { ...user_data } });
    }

    const is_user_exist = await prisma.user.findUnique({
      where: { id },
      select: {
        email: true,
        name: true,
        is_email_verified: true,
        avatar_url: true,
      },
    });

    if (!is_user_exist) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: 'User not found' });
    }

    await redis_client.set(
      `user_cache_${id}`,
      JSON.stringify({ ...is_user_exist }),
      { EX: 21600 },
    );

    res
      .status(StatusCodes.OK)
      .json({ message: 'User find', user: { ...is_user_exist } });
  },
);

export const user_info_update = try_catch_handler(
  async (req: Request, res: Response) => {
    const { id } = req.user;
    const { name, avatar_url } = req.body;

    const is_user_exist = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!is_user_exist) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: 'User not found' });
    }

    const update = { name: '', avatar_url: '' };

    if (name) {
      update.name = name;
    }

    if (avatar_url) {
      update.avatar_url = avatar_url;
    }
    const update_user = await prisma.user.update({
      where: { id },
      data: update,
      select: {
        name: true,
        avatar_url: true,
        email: true,
        is_email_verified: true,
      },
    });

    await redis_client.set(
      `user_cache_${id}`,
      JSON.stringify({ ...update_user }),
      { EX: 21600 },
    );

    res.status(StatusCodes.OK).json({ message: 'Update successfully' });
  },
);

export const user_delete = try_catch_handler(
  async (req: Request, res: Response) => {
    const { id } = req.user;

    const is_user_exist = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!is_user_exist) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: 'User not found' });
    }

    await prisma.user.delete({
      where: { id },
      select: { id: true },
    });

    await redis_client.del(`user_cache_${id}`);

    res.status(StatusCodes.OK).json({ message: 'Delete successfully' });
  },
);
