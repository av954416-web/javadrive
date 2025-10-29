import {
  users,
  cars,
  bookings,
  payments,
  reviews,
  type User,
  type UpsertUser,
  type Car,
  type InsertCar,
  type Booking,
  type InsertBooking,
  type Payment,
  type InsertPayment,
  type Review,
  type InsertReview,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Car operations
  getAllCars(): Promise<(Car & { averageRating?: number; reviewCount?: number })[]>;
  getCarById(id: string): Promise<Car | undefined>;
  getCarsByOwner(ownerId: string): Promise<Car[]>;
  createCar(car: InsertCar): Promise<Car>;
  updateCar(id: string, car: Partial<InsertCar>): Promise<Car | undefined>;
  deleteCar(id: string): Promise<void>;

  // Booking operations
  getAllBookings(): Promise<Booking[]>;
  getBookingById(id: string): Promise<Booking | undefined>;
  getBookingsByUser(userId: string): Promise<Booking[]>;
  getBookingsByOwner(ownerId: string): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking | undefined>;
  checkAvailability(carId: string, startDate: Date, endDate: Date): Promise<boolean>;

  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentByBookingId(bookingId: string): Promise<Payment | undefined>;
  updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment | undefined>;

  // Review operations
  getReviewsByCarId(carId: string): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: string, review: Partial<InsertReview>): Promise<Review | undefined>;
  getAverageRating(carId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Car operations
  async getAllCars(): Promise<(Car & { averageRating?: number; reviewCount?: number })[]> {
    const allCars = await db.select().from(cars).where(eq(cars.isAvailable, true));
    
    // Get ratings for each car
    const carsWithRatings = await Promise.all(
      allCars.map(async (car) => {
        const carReviews = await db.select().from(reviews).where(eq(reviews.carId, car.id));
        const avgRating = carReviews.length > 0
          ? carReviews.reduce((sum, r) => sum + r.rating, 0) / carReviews.length
          : 0;
        
        return {
          ...car,
          averageRating: avgRating,
          reviewCount: carReviews.length,
        };
      })
    );

    return carsWithRatings;
  }

  async getCarById(id: string): Promise<Car | undefined> {
    const [car] = await db.select().from(cars).where(eq(cars.id, id));
    return car;
  }

  async getCarsByOwner(ownerId: string): Promise<Car[]> {
    return await db.select().from(cars).where(eq(cars.ownerId, ownerId));
  }

  async createCar(carData: InsertCar): Promise<Car> {
    const [car] = await db.insert(cars).values(carData).returning();
    return car;
  }

  async updateCar(id: string, carData: Partial<InsertCar>): Promise<Car | undefined> {
    const [car] = await db
      .update(cars)
      .set({ ...carData, updatedAt: new Date() })
      .where(eq(cars.id, id))
      .returning();
    return car;
  }

  async deleteCar(id: string): Promise<void> {
    await db.delete(cars).where(eq(cars.id, id));
  }

  // Booking operations
  async getAllBookings(): Promise<Booking[]> {
    return await db.select().from(bookings).orderBy(desc(bookings.createdAt));
  }

  async getBookingById(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async getBookingsByUser(userId: string): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.createdAt));
  }

  async getBookingsByOwner(ownerId: string): Promise<Booking[]> {
    // Get all cars owned by this owner
    const ownerCars = await this.getCarsByOwner(ownerId);
    const carIds = ownerCars.map(car => car.id);
    
    if (carIds.length === 0) return [];
    
    // Get all bookings for these cars
    const allBookings: Booking[] = [];
    for (const carId of carIds) {
      const carBookings = await db
        .select()
        .from(bookings)
        .where(eq(bookings.carId, carId))
        .orderBy(desc(bookings.createdAt));
      allBookings.push(...carBookings);
    }
    
    return allBookings;
  }

  async createBooking(bookingData: InsertBooking): Promise<Booking> {
    const [booking] = await db.insert(bookings).values(bookingData).returning();
    return booking;
  }

  async updateBooking(id: string, bookingData: Partial<InsertBooking>): Promise<Booking | undefined> {
    const [booking] = await db
      .update(bookings)
      .set({ ...bookingData, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return booking;
  }

  async checkAvailability(carId: string, startDate: Date, endDate: Date): Promise<boolean> {
    // Check for overlapping bookings that are confirmed or pending
    const overlappingBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.carId, carId),
          sql`${bookings.status} IN ('confirmed', 'pending')`,
          sql`(${bookings.startDate} <= ${endDate} AND ${bookings.endDate} >= ${startDate})`
        )
      );

    return overlappingBookings.length === 0;
  }

  // Payment operations
  async createPayment(paymentData: InsertPayment): Promise<Payment> {
    const [payment] = await db.insert(payments).values(paymentData).returning();
    return payment;
  }

  async getPaymentByBookingId(bookingId: string): Promise<Payment | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.bookingId, bookingId));
    return payment;
  }

  async updatePayment(id: string, paymentData: Partial<InsertPayment>): Promise<Payment | undefined> {
    const [payment] = await db
      .update(payments)
      .set({ ...paymentData, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return payment;
  }

  // Review operations
  async getReviewsByCarId(carId: string): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.carId, carId))
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(reviewData: InsertReview): Promise<Review> {
    const [review] = await db.insert(reviews).values(reviewData).returning();
    return review;
  }

  async updateReview(id: string, reviewData: Partial<InsertReview>): Promise<Review | undefined> {
    const [review] = await db
      .update(reviews)
      .set({ ...reviewData, updatedAt: new Date() })
      .where(eq(reviews.id, id))
      .returning();
    return review;
  }

  async getAverageRating(carId: string): Promise<number> {
    const carReviews = await this.getReviewsByCarId(carId);
    if (carReviews.length === 0) return 0;
    
    const total = carReviews.reduce((sum, review) => sum + review.rating, 0);
    return total / carReviews.length;
  }
}

export const storage = new DatabaseStorage();
