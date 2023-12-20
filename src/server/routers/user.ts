import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { TRPCError } from '@trpc/server';

import { privateProcedure, publicProcedure, router } from '../trpc';

export const userRouter = router({
  register: publicProcedure
    .input(
      z.object({
        email: z.string().refine(
          (val) => z.string().email().safeParse(val).success,
          (val) => ({
            message:
              val.length > 0 ? 'email is invalid' : "email can't be blank",
          }),
        ),
        password: z.string().min(1, "password can't be blank"),
        username: z.string().min(1, "username can't be blank"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { email, password, username } = input;

      const [userWithEmailAlreadyExist, userWithUsernameAlreadyExist] =
        await Promise.all([
          ctx.prisma.user.findUnique({
            where: { email },
          }),
          ctx.prisma.user.findUnique({
            where: { username },
          }),
        ]);

      if (userWithEmailAlreadyExist) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'user with this email already exists',
        });
      }

      if (userWithUsernameAlreadyExist) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'user with this username already exists',
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = await ctx.prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
        },
        select: {
          id: true,
        },
      });

      const accessToken = jwt.sign(String(user.id), process.env.JWT_SECRET!);

      return { id: user.id, accessToken };
    }),
  login: publicProcedure
    .input(
      z.object({
        email: z.string().min(1, "email can't be blank"),
        password: z.string().min(1, "password can't be blank"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { email, password } = input;

      const userWithGivenEmail = await ctx.prisma.user.findUnique({
        where: {
          email,
        },
        select: {
          id: true,
          password: true,
        },
      });

      if (!userWithGivenEmail) {
        throw new TRPCError({
          message: 'user with this email does not exist',
          code: 'BAD_REQUEST',
        });
      }

      const passwordsMatch = await bcrypt.compare(
        password,
        userWithGivenEmail.password,
      );

      if (!passwordsMatch) {
        throw new TRPCError({
          message: 'password is not correct',
          code: 'BAD_REQUEST',
        });
      }

      const accessToken = jwt.sign(
        String(userWithGivenEmail.id),
        process.env.JWT_SECRET!,
      );

      return {
        id: userWithGivenEmail.id,
        accessToken,
      };
    }),
  update: privateProcedure
    .input(
      z.object({
        image: z.string().optional(),
        bio: z.string().optional(),
        username: z.string().optional(),
        email: z
          .string()
          .email('email is invalid')
          .optional()
          .or(z.literal('')),
        password: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Filter input to avoid fields with empty strings
      const filteredInput = Object.fromEntries(
        Object.entries(input).filter(([_, value]) => Boolean(value)),
      );

      if (filteredInput.email) {
        const userWithEmailAlreadyExist = await ctx.prisma.user.findUnique({
          where: {
            email: filteredInput.email,
            NOT: {
              id: ctx.userId,
            },
          },
        });

        if (userWithEmailAlreadyExist) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'email must be unique',
          });
        }
      }

      if (filteredInput.username) {
        const userWithUsernameAlreadyExist = await ctx.prisma.user.findUnique({
          where: {
            username: filteredInput.username,
            NOT: {
              id: ctx.userId,
            },
          },
        });

        if (userWithUsernameAlreadyExist) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'username must be unique',
          });
        }
      }

      if (filteredInput.password) {
        const salt = await bcrypt.genSalt(10);
        filteredInput.password = await bcrypt.hash(
          filteredInput.password,
          salt,
        );
      }

      const updatedUser = await ctx.prisma.user.update({
        where: { id: ctx.userId },
        data: filteredInput,
        select: {
          id: true,
        },
      });

      return { id: updatedUser.id };
    }),
  getCurrentUser: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) return null;

    const currentUser = await ctx.prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { id: true, username: true, email: true, bio: true, image: true },
    });

    return currentUser || null;
  }),
  getByUsername: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input: username }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { username },
        select: {
          id: true,
          image: true,
          username: true,
          bio: true,
          followedBy: ctx.userId ? { where: { id: ctx.userId } } : undefined,
        },
      });

      if (!user) {
        throw new TRPCError({
          message: 'user with this username does not exist',
          code: 'NOT_FOUND',
        });
      }

      return {
        id: user.id,
        username: user.username,
        image: user.image,
        bio: user.bio,
        isFollowing: Boolean(user.followedBy?.[0]),
      };
    }),
  changeFollowingStatus: privateProcedure
    .input(z.number())
    .mutation(async ({ input: targetUserId, ctx }) => {
      const targetUser = await ctx.prisma.user.findUnique({
        where: {
          id: targetUserId,
        },
        include: {
          followedBy: {
            where: {
              id: ctx.userId,
            },
          },
        },
      });

      if (!targetUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      const isFollowing = Boolean(targetUser.followedBy[0]);

      await ctx.prisma.user.update({
        where: {
          id: targetUser.id,
        },
        data: {
          followedBy: {
            connect: !isFollowing ? { id: ctx.userId } : undefined,
            disconnect: isFollowing ? { id: ctx.userId } : undefined,
          },
        },
      });
    }),
});
