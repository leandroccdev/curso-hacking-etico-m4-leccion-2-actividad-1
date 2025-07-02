'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        return queryInterface.bulkInsert(
            'user',
            [
                {
                    name: "admin",
                    // 2025#he048
                    password: '$2b$10$Livu/kVASTP00Nt.vdX4mudgykvjGtqxBn/IM9snx.8hBFHicQibi',
                    isAdmin: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ]
        );
    },

    async down(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('user', null, {});
    }
};