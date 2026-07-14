import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Company, CompanyDocument } from './schemas/company.schema';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company.name)
    private readonly companyModel: Model<CompanyDocument>,
  ) {}

  create(createCompanyDto: CreateCompanyDto): Promise<CompanyDocument> {
    return this.companyModel.create(createCompanyDto);
  }

  findAll(): Promise<CompanyDocument[]> {
    return this.companyModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<CompanyDocument> {
    const company = await this.companyModel.findById(id).exec();
    if (!company) {
      throw new NotFoundException(`Company with id "${id}" not found`);
    }
    return company;
  }

  async update(
    id: string,
    updateCompanyDto: UpdateCompanyDto,
  ): Promise<CompanyDocument> {
    const company = await this.companyModel
      .findByIdAndUpdate(id, updateCompanyDto, {
        new: true,
        runValidators: true,
      })
      .exec();
    if (!company) {
      throw new NotFoundException(`Company with id "${id}" not found`);
    }
    return company;
  }

  async remove(id: string): Promise<void> {
    const company = await this.companyModel.findByIdAndDelete(id).exec();
    if (!company) {
      throw new NotFoundException(`Company with id "${id}" not found`);
    }
  }

  async exists(id: string): Promise<boolean> {
    const found = await this.companyModel.exists({ _id: id }).exec();
    return found !== null;
  }
}
